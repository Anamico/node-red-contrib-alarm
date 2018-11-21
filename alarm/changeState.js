'use strict';

//const async = require('async');

module.exports = function(RED) {

    function AnamicoAlarmChangeState(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.configError = false;
        this.fromHomekit = config.fromHomekit || 0 == 1;
        this._panel = RED.nodes.getNode(config.panel);

        /**
         * handle inputs
         */
        node.on('input', function(msg) {
            node.log(node);

            if (this.configError) { return; }  // ignore everything if in error state, can only redeploy to fix this state
            // error if not in homekit mode and we get a homekit message
            if (!this.fromHomekit && msg.hap && msg.hap.context) {
                node.error('homekit message received when not in homekit mode', msg);
                node.status({ fill: "red", shape: "dot", text: "homekit message received" });
                this.configError = true;
                return
            }

            // silently ignore non-homekit messages (if we are expecting homekit) to avoid loops
            if (this.fromHomekit && !(msg.hap && msg.hap.context)) {
                return
            }
            delete msg.hap; // make sure we remove "hap" details to avoid future problems down the track.

            if (!msg.payload) {
                node.error('empty message received', msg);
                node.status({ fill: "red", shape: "dot", text: "empty message received" });
                return
            }

            msg.payload.fromHomekit = true;

            node.status({ fill: "blue", shape:"dot", text: "updating panel..." });
            node._panel.setState(msg, function(result) {
                node.status({ fill: result.error ? "red" : "green", shape: "dot", text: result.label });
            });
        });

        /**
         * listen for panel state changes
         */
        this._panel.registerStateListener(this, function(msg) {
            if (node.configError) { node._panel.deregisterStateListener(node); return; }   // ignore everything if in error state, can only redeploy to fix this state
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
    RED.nodes.registerType("AnamicoAlarmChangeState", AnamicoAlarmChangeState);
};
