import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const deploy_spec = [
    {
        instance: {
            group: "web",
            name: [
                "demo-web-01",
                "demo-web-02"
            ],
            ami: "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*",
            virtualizationType: "hvm",
            instanceType: "t2.micro",
            rootBlockDevice: { volumeSize: 8, volumeType: "gp2" },
            ebsBlockDevices: [
                { deviceName: "/dev/xvdb", volumeSize: 30, volumeType: "gp2" }
            ],
            public: false,
            vpc: "vpc-ap-northeast-1-01",
            subnet: "subnet-test-ap-northeast-1-01",
            keyName: "pulumi-ts-operator-aws",
            securitygroup: {
                ingress: [
                    { cidrBlocks: ["172.32.0.64/28", "172.32.0.80/28"], protocol: "tcp", fromPort: 22, toPort: 22 },
                    { cidrBlocks: ["0.0.0.0/0"], protocol: "tcp", fromPort: 80, toPort: 80 },
                    { cidrBlocks: ["0.0.0.0/0"], protocol: "tcp", fromPort: 443, toPort: 443 },
                ],
                egress: []
            },
            tags: {
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        }
    }
]

for (var i in deploy_spec) {
    // Create Amazon Virtual Private Cloud default security group.
    const securitygroup = new aws.ec2.SecurityGroup(deploy_spec[i].instance.group, {
        vpcId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].instance.vpc] }] })).id,
        ingress: deploy_spec[i].instance.securitygroup.ingress,
        egress: deploy_spec[i].instance.securitygroup.egress,
        tags: { ...deploy_spec[i].instance.tags, ...{ Name: `sg-${deploy_spec[i].instance.group}` } }
    });
    // Create Amazon EC2 instance.
    for (var instance_index in deploy_spec[i].instance.name) {
        const instance = new aws.ec2.Instance(deploy_spec[i].instance.name[instance_index], {
            ami: pulumi.output(aws.ec2.getAmi({ mostRecent: true, filters: [{ name: "name", values: [deploy_spec[i].instance.ami], }, { name: "virtualization-type", values: [deploy_spec[i].instance.virtualizationType], },], })).id,
            instanceType: deploy_spec[i].instance.instanceType,
            rootBlockDevice: { ...deploy_spec[i].instance.rootBlockDevice, ...{ tags: { ...deploy_spec[i].instance.tags, ...{ Name: `osdisk-${deploy_spec[i].instance.name[instance_index]}` } }, } },
            ebsBlockDevices: deploy_spec[i].instance.ebsBlockDevices,
            keyName: deploy_spec[i].instance.keyName,
            subnetId: pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].instance.subnet], }], })).id,
            tags: { ...deploy_spec[i].instance.tags, ...{ Name: deploy_spec[i].instance.name[instance_index] } },
        }, { dependsOn: [securitygroup,] });
        const sgattachment = new aws.ec2.NetworkInterfaceSecurityGroupAttachment(deploy_spec[i].instance.name[instance_index], {
            securityGroupId: securitygroup.id,
            networkInterfaceId: instance.primaryNetworkInterfaceId,
        }, { dependsOn: [instance] });
        if (deploy_spec[i].instance.public) {
            const instanceeip = new aws.ec2.Eip(deploy_spec[i].instance.name[instance_index], {
                instance: instance.id,
                vpc: true,
                tags: { ...deploy_spec[i].instance.tags, ...{ Name: `eip-${deploy_spec[i].instance.name[instance_index]}` } }
            }, { dependsOn: [instance] });
        }
    }
}