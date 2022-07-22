import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const deploy_spec = [
    {
        flowlog: {
            vpc: [
                { name: "vpc-ap-northeast-1-01", trafficType: "ALL", maxAggregationInterval: 60 },
                { name: "vpc-ap-northeast-1-02", trafficType: "REJECT", maxAggregationInterval: 60 }
            ],
            retentionInDays: 3,
            tags: {
                Name: "lg-vpc-ap-northeast-1",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        }
    }
]

// Create IAM role.
const role = new aws.iam.Role("vpc-flow-logs-role", {
    assumeRolePolicy: `{
            "Version": "2012-10-17",
            "Statement": [{
                "Sid": "",
                "Effect": "Allow",
                "Principal": {
                  "Service": "vpc-flow-logs.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
              }
            ]
          }`
});

// Create IAM role inline policy.
const rolepolicy = new aws.iam.RolePolicy("vpc-flow-logs-rolepolicy", {
    role: role.id,
    policy: `{
            "Version": "2012-10-17",
            "Statement": [{
                "Action": [
                  "logs:CreateLogGroup",
                  "logs:CreateLogStream",
                  "logs:PutLogEvents",
                  "logs:DescribeLogGroups",
                  "logs:DescribeLogStreams"
                ],
                "Effect": "Allow",
                "Resource": "*"
              }
            ]
          }`
}, { dependsOn: [role] });

for (var i in deploy_spec) {
    // Create CloudWatch Log Group resource.
    const loggroup = new aws.cloudwatch.LogGroup(deploy_spec[i].flowlog.tags.Name, {
        retentionInDays: deploy_spec[i].flowlog.retentionInDays,
        tags: deploy_spec[i].flowlog.tags
    }, { dependsOn: [rolepolicy] });
    // Create Virtual Private Cloud Flow Log.
    for (var vpc_index in deploy_spec[i].flowlog.vpc) {
        const flowlog = new aws.ec2.FlowLog(deploy_spec[i].flowlog.vpc[vpc_index].name, {
            iamRoleArn: role.arn,
            logDestination: loggroup.arn,
            maxAggregationInterval: deploy_spec[i].flowlog.vpc[vpc_index].maxAggregationInterval,
            trafficType: deploy_spec[i].flowlog.vpc[vpc_index].trafficType,
            vpcId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].flowlog.vpc[vpc_index].name], }], })).id,
        }, { dependsOn: [loggroup] });
    }
}