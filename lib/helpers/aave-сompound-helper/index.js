'use strict'
const { HelperBase } = require("./helper-base");
const { HelperV1 } = require("./helper-v1");
const { HelperV2 } = require("./helper-v2");
const { HelperV3 } = require("./helper-v3");
const { HelperCompound } = require("./helper-compound");
const { getHelper, createHelperV1, createHelperV2, createHelperV3, createHelperCompound } = require("./helper-factory");

module.exports = {
  HelperBase, HelperV1, HelperV2, HelperV3, HelperCompound,
  getHelper, createHelperV1, createHelperV2, createHelperV3, createHelperCompound
};

/*
const { getHelper } = require('./helpers');

const helper = getHelper('V1', provider);
*/
