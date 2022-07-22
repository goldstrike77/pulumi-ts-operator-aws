import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const deploy_spec = [
    {
        bastion: {
            ami: "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*",
            virtualizationType: "hvm",
            instanceType: "t2.micro",
            associatePublicIpAddress: true,
            rootBlockDevice: { volumeSize: 8, volumeType: "gp2" },
            ebsBlockDevices: [],
            keyName: "pulumi-ts-operator-aws",
            vpc: "vpc-ap-northeast-1-01",
            subnet: ["subnet-bastion-ap-northeast-1-01", "subnet-bastion-ap-northeast-1-02"],
            minSize: 1,
            maxSize: 1,
            healthCheckType: "EC2",
            healthCheckGracePeriod: 0,
            defaultCooldown: 900,
            securitygroup: {
                ingress: [
                    { cidrBlocks: ["0.0.0.0/0"], protocol: "icmp", fromPort: 8, toPort: 0 },
                    { cidrBlocks: ["0.0.0.0/0"], protocol: "tcp", fromPort: 22, toPort: 22 }
                ],
                egress: [
                    { cidrBlocks: ["0.0.0.0/0"], protocol: "icmp", fromPort: 8, toPort: 0 },
                    { cidrBlocks: ["0.0.0.0/0"], protocol: "tcp", fromPort: 22, toPort: 22 },
                    { cidrBlocks: ["0.0.0.0/0"], protocol: "tcp", fromPort: 80, toPort: 80 },
                    { cidrBlocks: ["0.0.0.0/0"], protocol: "tcp", fromPort: 443, toPort: 443 },
                    { cidrBlocks: ["0.0.0.0/0"], protocol: "udp", fromPort: 53, toPort: 53 },
                    { cidrBlocks: ["0.0.0.0/0"], protocol: "udp", fromPort: 123, toPort: 123 }
                ]
            },
            tags: {
                Name: "i-demo-bastion",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        }
    }
]

for (var i in deploy_spec) {
    // Create Virtual Private Cloud default security group.
    const securitygroup = new aws.ec2.SecurityGroup(deploy_spec[i].bastion.tags.Name, {
        vpcId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].bastion.vpc] }] })).id,
        ingress: deploy_spec[i].bastion.securitygroup.ingress,
        egress: deploy_spec[i].bastion.securitygroup.egress,
        tags: { ...deploy_spec[i].bastion.tags, ...{ Name: `sg-${deploy_spec[i].bastion.tags.Name}` } }
    });
    // Create IAM role.
    const role = new aws.iam.Role(deploy_spec[i].bastion.tags.Name, {
        name: `Linux-bastion-${deploy_spec[i].bastion.tags.Name}`,
        assumeRolePolicy: `{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
          }`
    }, { dependsOn: [securitygroup,] });
    // Create IAM role inline policy.
    const rolepolicy = new aws.iam.RolePolicy(deploy_spec[i].bastion.tags.Name, {
        role: role.id,
        policy: `{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:GetLogEvents",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams",
                        "logs:PutRetentionPolicy",
                        "logs:PutMetricFilter",
                        "logs:CreateLogGroup"
                    ],
                    "Resource": "*",
                    "Effect": "Allow"
                },
                {
                    "Action": [
                        "ec2:DescribeAddresses"
                    ],
                    "Resource": "*",
                    "Effect": "Allow"
                },
                {
                    "Action": [
                        "ec2:AssociateAddress"
                    ],
                    "Resource": "*",
                    "Effect": "Allow"
                }
            ]
          }`
    }, { dependsOn: [role] });
    // Create IAM instance profile.
    const instanceprofile = new aws.iam.InstanceProfile(deploy_spec[i].bastion.tags.Name, {
        role: role.name,
        tags: deploy_spec[i].bastion.tags
    }, { dependsOn: [rolepolicy,] });
    // Create launch configuration for autoscaling groups.
    const launchconfiguration = new aws.ec2.LaunchConfiguration(deploy_spec[i].bastion.tags.Name, {
        imageId: pulumi.output(aws.ec2.getAmi({ mostRecent: true, filters: [{ name: "name", values: [deploy_spec[i].bastion.ami], }, { name: "virtualization-type", values: [deploy_spec[i].bastion.virtualizationType], },], })).id,
        instanceType: deploy_spec[i].bastion.instanceType,
        keyName: deploy_spec[i].bastion.keyName,
        associatePublicIpAddress: deploy_spec[i].bastion.associatePublicIpAddress,
        ebsBlockDevices: deploy_spec[i].bastion.ebsBlockDevices,
        rootBlockDevice: deploy_spec[i].bastion.rootBlockDevice,
        iamInstanceProfile: instanceprofile.name,
        securityGroups: [securitygroup.id]
    }, { dependsOn: [instanceprofile,] });
    // Create AutoScaling Groups.
    const autoscaling = new aws.autoscaling.Group(deploy_spec[i].bastion.tags.Name, {
        vpcZoneIdentifiers: [
            pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].bastion.subnet[0]] }] })).id,
            pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].bastion.subnet[1]] }] })).id
        ],
        launchConfiguration: launchconfiguration.name,
        defaultCooldown: deploy_spec[i].bastion.defaultCooldown,
        minSize: deploy_spec[i].bastion.minSize,
        maxSize: deploy_spec[i].bastion.maxSize,
        healthCheckType: deploy_spec[i].bastion.healthCheckType,
        healthCheckGracePeriod: deploy_spec[i].bastion.healthCheckGracePeriod,
        tags: [
            { key: "Name", value: deploy_spec[i].bastion.tags.Name, propagateAtLaunch: true }
        ]
    }, { dependsOn: [launchconfiguration] });
}