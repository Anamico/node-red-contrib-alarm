'use strict';

const async = require('async');

module.exports = function(RED) {

    function Panel(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.sensor = function(callback) {
            callback(true);
        };
    }
    RED.nodes.registerType("AnamicoAlarmPanel", Panel);
};
