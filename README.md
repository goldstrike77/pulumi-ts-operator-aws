[![Deploy](https://get.pulumi.com/new/button.svg)]

## Running the App

Follow the steps in [Pulumi Installation and Setup](https://www.pulumi.com/docs/get-started/install/) and [Configuring Pulumi
AWS](https://www.pulumi.com/registry/packages/aws/installation-configuration/) to get setup with Pulumi and AWS.

Install dependencies:

```
$ npm install
```

Preview the deployment of the application:

```
$ pulumi preview
Previewing update (aws-demo/infrastructure-log-ap-northeast-1)
     Type                        Name                                    Plan
 +   pulumi:pulumi:Stack         demo-infrastructure-log-ap-northeast-1  create
 +   ├─ aws:iam:Role             vpc-flow-logs-role                      create
 +   ├─ aws:iam:RolePolicy       vpc-flow-logs-rolepolicy                create
 +   ├─ aws:cloudwatch:LogGroup  lg-vpc-ap-northeast-1                   create
 +   ├─ aws:ec2:FlowLog          vpc-ap-northeast-1-02                   create
 +   └─ aws:ec2:FlowLog          vpc-ap-northeast-1-01                   create

Resources:
    + 6 to create
```

Perform the deployment:

```
$ pulumi up --skip-preview
Updating (aws-demo/infrastructure-log-ap-northeast-1)
     Type                        Name                                    Status
 +   pulumi:pulumi:Stack         demo-infrastructure-log-ap-northeast-1  created
 +   ├─ aws:iam:Role             vpc-flow-logs-role                      created
 +   ├─ aws:iam:RolePolicy       vpc-flow-logs-rolepolicy                created
 +   ├─ aws:cloudwatch:LogGroup  lg-vpc-ap-northeast-1                   created
 +   ├─ aws:ec2:FlowLog          vpc-ap-northeast-1-02                   created
 +   └─ aws:ec2:FlowLog          vpc-ap-northeast-1-01                   created

Resources:
    + 6 created

Duration: 11s
```

When you're ready to be done with demo, you can destroy the resource:

```
$ pulumi destroy -y
Destroying (aws-demo/infrastructure-log-ap-northeast-1)
     Type                        Name                                    Status
 -   pulumi:pulumi:Stack         demo-infrastructure-log-ap-northeast-1  deleted
 -   ├─ aws:ec2:FlowLog          vpc-ap-northeast-1-01                   deleted
 -   ├─ aws:ec2:FlowLog          vpc-ap-northeast-1-02                   deleted
 -   ├─ aws:cloudwatch:LogGroup  lg-vpc-ap-northeast-1                   deleted
 -   ├─ aws:iam:RolePolicy       vpc-flow-logs-rolepolicy                deleted
 -   └─ aws:iam:Role             vpc-flow-logs-role                      deleted

Resources:
    - 6 deleted

Duration: 6s
```