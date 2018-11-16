'use strict';

//const async = require('async');

module.exports = function(RED) {

    function AnamicoAlarmSendState(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this._panel = RED.nodes.getNode(config.panel);

        this._panel.registerStateSender(function(newState) {
            node.send(newState);
        });
    }
    RED.nodes.registerType("AnamicoAlarmSendState", AnamicoAlarmSendState);
};
