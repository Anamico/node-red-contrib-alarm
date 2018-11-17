'use strict';

//const async = require('async');

module.exports = function(RED) {

    function AnamicoAlarmChangeState(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this._panel = RED.nodes.getNode(config.panel);

        /**
         * handle inputs
         */
        node.on('input', function(msg) {
            node.log(node);
            node.status({ fill: "blue", shape:"dot", text: "updating panel..." });
            node._panel.setState(msg, function(result) {
                node.status({ fill: result.error ? "red" : "green", shape: "dot", text: result.label });
            });
        });

        /**
         * listen for panel state changes
         */
        this._panel.registerStateListener(this, function(msg) {
            node.status({
                fill: node._panel.isAlarm ? "red" : "green",
                shape:"dot",
                text:"state: " + node._panel.alarmModes[node._panel.alarmState]
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
    RED.nodes.registerType("AnamicoAlarmChangeState", AnamicoAlarmChangeState);
};
