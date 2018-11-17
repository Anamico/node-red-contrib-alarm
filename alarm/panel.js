'use strict';

const async = require('async');

module.exports = function(RED) {

    var stateSenders = [];

    function AnamicoAlarmPanel(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.alarmModes = [ 'Home', 'Away', 'Night', 'Off', 'Alarm' ];

        this.alarmState = node.context().global.get('SecuritySystemCurrentState') || 0;
        this.alarmType = node.context().global.get('SecuritySystemAlarmType') || 0;
        this.isAlarm = node.alarmState === 4;

        this.setState = function(state) {
            node.alarmState = state;
            node.isAlarm = state === 4;
            node.context().global.set('SecuritySystemCurrentState', state);
        };

        this.setAlarmType = function(alarmType) {
            this.alarmType = alarmType;
            node.context().global.set('SecuritySystemAlarmType', alarmType);
        };

        this.sensor = function(callback) {
            callback(true);
        };

        this.registerStateSender = function(callback) {
            stateSenders.push(callback);

            // also emit current state on registration (after delay of 100 msec?):
            setTimeout(function() {
                callback({
                    payload: {
                        //SecuritySystemTargetState: localState,
                        SecuritySystemCurrentState: node.alarmState,
                        SecuritySystemAlarmType: node.alarmType
                    }
                });
            }, 100);
        };

        this.notifyChange = function (msg, fromHomekit) {

            if (fromHomekit) {
                node.log("from homekit");
                msg.payload.fromHomekit = true;
            } else {
                node.log("local");
            }
            node.log(JSON.stringify(msg,null,2));

            async.parallel(stateSenders, function(stateSender, callback) {
                stateSender(msg);
                callback(null);
            });
        };

        this.setState = function(msg) {

            // only do something if we have been fed a new security state
            node.log(JSON.stringify(msg,null,2));

            if (!msg.payload) {
                node.error('invalid payload', msg);
                return;
            }

            const targetState = msg.payload.SecuritySystemTargetState;
            const currentState = msg.payload.SecuritySystemCurrentState;
            var newState = currentState !== undefined ? currentState : targetState;
            var newAlarmType = msg.payload.SecuritySystemAlarmType;
            var alarmType = newAlarmType !== undefined ? newAlarmType : node.alarmType;

// look for alarms
            if (msg.payload.zone) {
                if (msg.payload.modes.indexOf(node.alarmState) < 0) {
                    node.log('no alarm');
                    return
                }
                node.log('Alarm: ');
                newState = 4;
                alarmType = 1;
            }

            node.log('newState: ' + newState + ' = ' + targetState + ' || ' + currentState);
            node.log('localState: ' + node.alarmState);
            node.log('alarmType: ' + alarmType + ' = ' + newAlarmType + ' || ' + node.alarmType);

            if ((newState === undefined) && (newAlarmType === undefined)) {
                node.error('invalid payload', msg);
                return;
            }

// Has anything changed?
            if ((newState !== undefined ? newState : node.alarmState) !== 4 ) {
                alarmType = 0
            }
            const alarmChanged = (node.alarmType != alarmType);
            const changed = (node.alarmState === undefined) || (node.alarmState != newState) || (node.alarmType === undefined)|| alarmChanged;
            if (!changed) {
                node.log('no change');
                return;
            }

// persist the new state
            node.setState(newState !== undefined ? newState : node.alarmState);
            node.setAlarmType(alarmType);

            const fromHomekit = msg.hap && msg.hap.context && (targetState !== undefined);
            delete msg.hap;

            msg.payload = {
                //SecuritySystemTargetState: global.SecuritySystemCurrentState,
                SecuritySystemCurrentState: node.alarmState
            };

            if (alarmChanged) {
                msg.payload.SecuritySystemAlarmType = node.alarmType;
            }

            node.notifyChange(msg, fromHomekit);
        };
    }
    RED.nodes.registerType("AnamicoAlarmPanel", AnamicoAlarmPanel);
};


