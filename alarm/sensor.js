'use strict';

//const async = require('async');

module.exports = function(RED) {
    const { compileExpression, useDotAccessOperatorAndOptionalChaining } = require("filtrex");
    
    function compileFiltrexExpression(expression) {
        const options = {
            // Allow boolean values in the Filtrex expressions.  For example "msg.payload == true".
            // See https://github.com/m93a/filtrex/issues/46#issuecomment-922105858
            constants: { 
                true: true,
                false: false
            },
            // Allow dot operators in the Filtex expressions.  For example "msg.payload".
            // See https://github.com/m93a/filtrex/issues/44#issuecomment-925914796
            customProp: useDotAccessOperatorAndOptionalChaining
        }
        
        return compileExpression(expression, options);
    }

    function AnamicoAlarmSensor(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this._panel = RED.nodes.getNode(config.panel);
        this.alarmStates = JSON.parse("[" + config.alarmStates + "]");

        this.resetTimer = null;
        
        var triggerCondition = config.triggerCondition;

        // For older nodes (version 1.2.5 and below) there was a dropdown triggerType, but no triggerCondition expression.
        // When such a node is started, the triggerType should be migrated to a corresponding triggerCondition expression.
        if (!triggerCondition) {
            if (config.triggerType == "1") {
                triggerCondition = "msg.payload.open == true"; 
            }
            else {
                triggerCondition = "";
            }
        }
        
        // No trigger condition should be converted to a trigger expression that matches all messages
        if (triggerCondition.trim() == "") {
            triggerCondition = "true == true";
        }
        
        // For performance reasons, the trigger expression will be compiled once at the start.
        // Under the hood a trigger function is being generated.
        if (triggerCondition) {
            try {
                node.triggerFunction = compileFiltrexExpression(triggerCondition);
            }
            catch(err) {
                node.error("Invalid trigger condition expression: " + err);
            }
        }

        node.on('input', function(msg) {

            //node.log(node.alarmStates);
            
            if (!node.triggerFunction) {
                node.warn("Invalid trigger condition expression cannot evaluate message");
                return;
            }
            
            var trigger = node.triggerFunction({msg: msg});
            
            if (trigger !== true && trigger !== false) {
                // Invalid input (e.g. "5" instead of 5) will result in trigger containing "TypeError: expected ..."
                trigger = false;
            }

            // if the sensor wasn't triggered then exit early
            if (!trigger) {
                return;
            }

            node.status({ fill:"blue", shape:"dot", text:"trigger" });

            msg.payload = {
                zone: "test",
		        source: node.name,
                modes: node.alarmStates
            };

            if (node.resetTimer) {
                clearTimeout(node.resetTimer);
            }
            node.resetTimer = setTimeout(function() {
                node.status({});
                // todo: allow for momentary and fixed (motion vs nc/no)
            }, 3000);

            node._panel && node._panel.sensor(msg, function(triggered) {
                if (triggered) {
                    node.log('triggered:' + triggered);
                    if (node.resetTimer) {
                        clearTimeout(node.resetTimer);
                        node.resetTimer = null;
                    }
                    return node.status({ fill:"red", shape:"dot", text:"ALARM!" });
                }
            });
        });

        // todo: persist the sensor state on the panel and check it/warn/alarm if alarm state when arming the panel

        /**
         * listen for panel state changes
         */
        node._panel && node._panel.registerStateListener(node, function(msg) {
            //
            // alarm state
            //
            const SecuritySystemCurrentState = msg.payload && msg.payload.SecuritySystemCurrentState;
            if (SecuritySystemCurrentState !== 4) {
                node.status({});
            }
        });

        /**
         * clean up on node removal
         */
        node.on('close', function() {
            node._panel && node._panel.deregisterStateListener(node);
        });

    }
    RED.nodes.registerType("AnamicoAlarmSensor", AnamicoAlarmSensor);

    // Make the expression syntax check available to the config screen in the Node-RED editor
    RED.httpAdmin.post('/anamico-alarm-sensor/check', function(req, res){
        // Decode the base64-encoded trigger condition in the body of the post request
        var buff = new Buffer(req.body.expression, 'base64');
        var triggerExpression = buff.toString('ascii');

        // Try to compile the trigger expression
        try {
            // When no trigger condition is available, that will be considered as a valid expression also
            if (triggerExpression.trim() != "") {
                compileFiltrexExpression(triggerExpression);
                res.json({result: "ok"});
            }
        }
        catch(err) {
            res.json({result: "error", error: err});
        }
    });
};
