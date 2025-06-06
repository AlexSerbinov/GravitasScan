# Events

Events є одним із критично важливих сервісів у структурі Liquidator, який виконує дві основні функції: моніторинг нових блоків і моніторинг GlobalReservesData.

![Events Service](../images/events.jpg)

## Функції сервісу Events

### 1. Моніторинг нових блоків:

- Сервіс Events відстежує появу нових блоків у блокчейні.
- Кожного разу, коли з'являється новий блок, сервіс відправляє MQTT повідомлення на Topic `data/block` всім іншим сервісам, які потребують цієї інформації, наприклад, сервісу Archive.
- Це дозволяє всім зацікавленим сервісам своєчасно отримувати інформацію про нові блоки і не навантажувати ETH ноду власними запитами.

### 2. Моніторинг GlobalReservesData:

- Service Events також відповідає за моніторинг і оновлення GlobalReservesData.
- GlobalReservesData містить критично важливу інформацію про токени, які використовуються нашими протоколами ліквідності.
- Кожен запис у GlobalReservesData включає наступні поля:
  - Список ERC20 токенів.
  - Decimals: кількість десяткових знаків для кожного токену.
  - Price: ціна токену відносно ETH або USD (для протоколів AAVE V1 та AAVE V2 ціна вказується до ETH, для AAVE V3 та Compound - до USD).
  - Bonus: відсоток бонусу, який протокол надає за ліквідацію певних позицій по конкретних токенах.

## Важливість GlobalReservesData

GlobalReservesData є критично важливим для функціонування системи Liquidator. Ось чому:

1. **Розрахунок MinBorrow і MinCollateral**: Ці параметри завжди виражені в ETH або USD. Для правильного розрахунку необхідно знати актуальну ціну кожного токена. Наприклад, якщо у нас в borrow є токен UNI, то щоб знати яка вартість borrow в USD, нам потрібно знати скільки коштує UNI в USD. Саме ця інформація міститься в GlobalReservesData.

2. **Різноманітність протоколів**: Кожен протокол має свій унікальний набір токенів, тому GlobalReservesData різниться для кожного протоколу. Наприклад:

   - AAVE V3 може мати список з 21 токена
   - Compound може мати 15 токенів, частково відмінних від AAVE

3. **Критична важливість для сервісів**: Без актуального GlobalReservesData деякі сервіси не можуть коректно функціонувати або навіть запуститися.

   Без GlobalReservesData не запустяться наступні сервіси:

   - Blacklist
   - Subgraph
   - DataFetcher
   - TransmitFetcher

   Крім того, сервіс Archive не буде коректно працювати без інформації про вихід нових блоків. Ці дані надсилає сервіс Events.

4. **Актуальність даних**: GlobalReservesData забезпечує всі сервіси актуальною інформацією про ціни токенів, що є критичним для правильного розрахунку позицій користувачів та прийняття рішень про ліквідацію.

## Режими роботи Service Events

Service Events може працювати у двох режимах залежно від типу підключення до Ethereum ноди:

### 1. WebSocket:

- Підключення до Ethereum ноди через WebSockets дозволяє отримувати дані в реальному часі.
- Це знижує навантаження на ноду і забезпечує швидку передачу інформації.

### 2. HTTP:

- Підключення до Ethereum ноди через HTTP дозволяє робити постійні запити з певним інтервалом (наприклад, кожні 10 мс).
- Хоча є теорія, що HTTP-запити можуть бути швидшими, деякі експерименти показали, що це не завжди так.
- Параметри тайм-ауту можуть бути налаштовані залежно від потреб.

GlobalReservesData надсилається окремо для кожного протоколу, наприклад `data/reserves/V1`, оскільки кожен протокол має свій специфічний набір токенів. Це забезпечує точність і актуальність даних необхідних для підрахунку ціни позиції.

## Приклад globalReservesData:

```json
{
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": {
    "price": {
      "type": "BigNumber",
      "hex": "0x010ebb1fcaa438"
    },
    "decimals": {
      "type": "BigNumber",
      "hex": "0x12"
    },
    "bonus": {
      "type": "BigNumber",
      "hex": "0x69"
    }
  },
  "0x0000000000085d4780B73119b644AE5ecd22b376": {
    "price": {
      "type": "BigNumber",
      "hex": "0x010e2dda4f252a"
    },
    "decimals": {
      "type": "BigNumber",
      "hex": "0x12"
    },
    "bonus": {
      "type": "BigNumber",
      "hex": "0x69"
    }
  }
}
```

Примітка: перевірити чи приходять на ваш сервіс globalReservesData можна підписавшись з терміналу на один з топіків.
Наприклад:

`mqtt sub -h "10.10.100.87" -t "data/reserves/V1"`

## Висновок

Сервіс Events забезпечує надійну і своєчасну передачу критично важливої інформації, що дозволяє всій системі Liquidator працювати ефективно і безперебійно.
