'use strict';

//const async = require('async');

module.exports = function(RED) {

    function AnamicoAlarmStateChanged(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this._panel = RED.nodes.getNode(config.panel);

        /**
         * listen for panel state changes
         */
        this._panel.registerStateListener(this, function(msg) {

            node.log("new State");
            node.log(msg);

            node.status({
                fill: node._panel.isAlarm ? "red" : "green",
                shape:"dot",
                text:node._panel.alarmModes[node._panel.alarmState]
            });

            node.send(msg);
        });

        /**
         * clean up on node removal
         */
        node.on('close', function() {
            node._panel.deregisterStateListener(node);
        });
    }
    RED.nodes.registerType("AnamicoAlarmStateChanged", AnamicoAlarmStateChanged);
};
