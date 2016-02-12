'use strict';

module.exports = function(SPlugin) {

    const AWS      = require('aws-sdk'),
        path       = require('path'),
        fs         = require('fs'),
        BbPromise  = require('bluebird'); // Serverless uses Bluebird Promises and we recommend you do to because they provide more than your average Promise :)

    class ServerlessPluginVpc extends SPlugin {
        constructor(S) {
            super(S);
        }

        static getName() {
            return 'com.serverless.' + ServerlessPluginVpc.name;
        }

        registerHooks() {

            this.S.addHook(this._addVpcAfterDeploy.bind(this), {
                action: 'functionDeploy',
                event:  'post'
            });
            this.S.addHook(this._addVpcAfterDeploy.bind(this), {
                action: 'dashDeploy',
                event:  'post'
            });

            return BbPromise.resolve();
        }

        /**
         * updates deployed function to set vpc
         *
         * @param object evt
         *
         * @return promise
         */
        _addVpcAfterDeploy(evt) {
            let _this = this;

            return new BbPromise(function(resolve, reject) {
                for(var region in evt.data.deployed) {
                    _this._manageVpc(evt, region);
                }

                return resolve(evt);
            });
        }

        /**
         * Handles the VPC update
         *
         * @param object evt Event
         * @param string region
         *
         * @return promise
         */
        _manageVpc (evt, region) {
            let _this = this;

            _this.stage = evt.options.stage;
            _this._initAws(region);

            if (_this.S.cli.action != 'deploy' || (_this.S.cli.context != 'function' && _this.S.cli.context != 'dash'))
                return;

            _this.vpcSettings = _this._getFunctionsVpcSettings(evt, region);

            // no vpc found
            if (_this.vpcSettings.length == 0) {
                return;
            }

            var functionVpcUpdates = [];
            for (var i in _this.vpcSettings) {
                functionVpcUpdates.push(
                    _this.lambda.updateFunctionConfigurationBbAsync({
                        "FunctionName": _this.vpcSettings[i].deployed.functionName,
                        "VpcConfig": _this.vpcSettings[i].vpcConfig
                    })
                );
            }

            BbPromise.all(functionVpcUpdates)
            .then(function(){
                console.log('vpc settings updated');
            });
        }

        /**
         * initializes aws
         *
         * @param string region
         *
         * @return void
         */
        _initAws (region) {
            let _this = this;

            _this.lambda = new AWS.Lambda({
                region: region,
                accessKeyId: this.S.config.awsAdminKeyId,
                secretAccessKey: this.S.config.awsAdminSecretKey
            });

            _this.lambda.updateFunctionConfigurationBbAsync = BbPromise.promisify(_this.lambda.updateFunctionConfiguration);
        }


        /**
         * parses the s-function.json file and returns the data
         *
         * @param object evt
         * @param string region
         *
         * @return array
         */
        _getFunctionsVpcSettings(evt, region){
            let _this = this;
            var settings = [];

            for (var deployedIndex in evt.data.deployed[region]) {
                let deployed = evt.data.deployed[region][deployedIndex],
                    settingsFile = _this.S.config.projectPath + '/' + deployed.sPath + '/s-function.json';

                if (!fs.existsSync(settingsFile)) {
                    continue;
                }

                var config = JSON.parse(fs.readFileSync(settingsFile));

                if (!config.vpcConfig) {
                    continue;
                }

                settings.push({
                    "deployed": deployed,
                    "vpcConfig": config.vpcConfig
                });
            }

            return settings;
        }
    }

    return ServerlessPluginVpc;
};
