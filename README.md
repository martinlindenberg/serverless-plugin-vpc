Serverless Plugin VPC
=========================

[![NPM](https://nodei.co/npm/serverless-plugin-vpc.png?downloads=true)](https://nodei.co/npm/serverless-plugin-vpc/)

This plugin adds vpc support to your lambda functions.

*Note*: This plugin supports Serverless 0.4*


### Installation

 - make sure that aws and serverless are installed
 - @see http://docs.aws.amazon.com/cli/latest/userguide/installing.html
 - @see http://www.serverless.com/

 - install this plugin to your projects node_modules folder

```
cd projectfolder
npm install serverless-plugin-vpc
```

 - add the plugin to your s-project.json file

```
"plugins": [
    "serverless-plugin-vpc"
]
```

### Run the Plugin

 - the plugin uses a hook that is called after each deployment of a function
 - you only have to deploy your function as usual `sls function deploy`
 - add the following attribute to the s-function.json in your functions folder

```
  ...
  "vpcConfig": {
      "SubnetIds": [
          "subnet-abcda004"
      ],
      "SecurityGroupIds": [
          "sg-abcdc999"
      ]
  },
  ...
```

 - Parameters:
  - the provided "vpcConfig" object will be forwarded to the aws-sdk method updateFunctionConfiguration
  - please check the docs for detailed descriptions http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#updateFunctionConfiguration-property

### modify IAM

- Check the role, that executes your Lambda.
- Normally you will receive an error:

```
Unhandled rejection AccessDeniedException: Your access has been denied by EC2, please make sure your function execution role have permission to CreateNetworkInterface. EC2 Error Code: UnauthorizedOperation. EC2 Error Message: You are not authorized to perform this operation.

```

- Please add the following role policy to the functions role:

```
{
  "Effect": "Allow",
  "Action": [
    "ec2:CreateNetworkInterface",
    "ec2:DescribeNetworkInterfaces",
    "ec2:DeleteNetworkInterface"
  ],
  "Resource": "*"
},
```
