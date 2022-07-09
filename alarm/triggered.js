'use strict';

module.exports = function(RED) {

    function AnamicoAlarmTriggered(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.format = parseInt(config.format || '0');
        this._panel = RED.nodes.getNode(config.panel);

        this.delay = typeof config.delay === 'string' ? parseInt( config.delay ) : 10;
        if (isNaN(this.delay)) {
            this.delay == 10;
        }

        this.timer = null;
        this.hasAlarmed = false;

        /**
         * fire the alarm output
         */
        function emitAlarm() {
            if (node.counter > 0) {
                node.status({
                    fill:   "grey",
                    shape:  "dot",
                    text:   "" + node.counter
                });
                node.counter = node.counter - 1;
                node.timer = setTimeout(emitAlarm, 1000);
                return;
            }
            node.timer = null;
            node.hasAlarmed = true;
            node.status({
                fill:   "red" ,
                shape:  "dot",
                text:   node._panel.alarmModes[node._panel.alarmState]
            });
            node.send({payload: {
                alarm: true,
                source: node.lastMsg && node.lastMsg.payload && node.lastMsg.payload.alarmSource
            }});
        }

        function clearAlarm() {
            if (node.timer) {
                clearTimeout(node.timer);
                node.timer = null;
            }
            node.status({});
            node.hasAlarmed = false;
        }

        /**
         * listen for panel state changes
         */
        node._panel && node._panel.registerStateListener(this, function(msg) {
            const SecuritySystemCurrentState = msg.payload.SecuritySystemCurrentState;
            const SecuritySystemAlarmType = msg.payload.SecuritySystemAlarmType;

            //
            // alarm state
            //
            if (SecuritySystemCurrentState == 4) {
                if (!node.timer && !node.hasAlarmed) {
                    node.counter = node.delay;
                    node.lastMsg = msg;
                    emitAlarm();
                }
            } else {
                //
                // alarm is cleared if the mode changes
                //
                clearAlarm();
            }

        });

        /**
         * clean up on node removal
         */
        node.on('close', function() {
            node._panel && node._panel.deregisterStateListener(node);
            if (node.timer) {
                clearTimeout(node.timer);
                node.timer = null;
            }
        });

    }
    RED.nodes.registerType("AnamicoAlarmTriggered", AnamicoAlarmTriggered);
};
