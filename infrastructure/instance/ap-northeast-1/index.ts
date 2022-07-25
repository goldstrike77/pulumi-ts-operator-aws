import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const deploy_spec = [
    {
        instance: {
            group: "web",
            name: [
                "i-demo-web-01",
                "i-demo-web-02"
            ],
            ami: "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*",
            virtualizationType: "hvm",
            instanceType: "t2.micro",
            rootBlockDevice: { volumeSize: 8, volumeType: "gp2" },
            ebsBlockDevices: [
                { deviceName: "/dev/xvdb", volumeSize: 30, volumeType: "gp2" }
            ],
            public: false,
            lb: {
                internal: true,
                loadBalancerType: "network",
                enableDeletionProtection: false,
                ipAddressType: "ipv4",
                args: [
                    { port: 80, protocol: "TCP" },
                    { port: 443, protocol: "TCP" }
                ]
            },
            vpc: "vpc-ap-northeast-1-01",
            subnet: "subnet-instance-ap-northeast-1-01",
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
    // Create Security group.
    const securitygroup = new aws.ec2.SecurityGroup(deploy_spec[i].instance.group, {
        vpcId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].instance.vpc] }] })).id,
        ingress: deploy_spec[i].instance.securitygroup.ingress,
        egress: deploy_spec[i].instance.securitygroup.egress,
        tags: { ...deploy_spec[i].instance.tags, ...{ Name: `sg-${deploy_spec[i].instance.group}` } }
    });
    // Create Network Load Balancer.
    const loadbalancer = new aws.lb.LoadBalancer(deploy_spec[i].instance.group, {
        name: `lb-${deploy_spec[i].instance.lb.loadBalancerType}-${deploy_spec[i].instance.group}`,
        internal: deploy_spec[i].instance.lb.internal,
        loadBalancerType: deploy_spec[i].instance.lb.loadBalancerType,
        subnets: [pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].instance.subnet] }] })).id],
        enableDeletionProtection: deploy_spec[i].instance.lb.enableDeletionProtection,
        tags: { ...deploy_spec[i].instance.tags, ...{ Name: `lb-${deploy_spec[i].instance.group}` } }
    }, { dependsOn: [securitygroup,] });
    // Create Target Group for Load Balancer.
    for (var targetgroup_index in deploy_spec[i].instance.lb.args) {
        const targetgroup = new aws.lb.TargetGroup(`${deploy_spec[i].instance.lb.args[targetgroup_index].protocol}-${deploy_spec[i].instance.lb.args[targetgroup_index].port}`, {
            name: `tc-${deploy_spec[i].instance.group}-${deploy_spec[i].instance.lb.args[targetgroup_index].protocol}-${deploy_spec[i].instance.lb.args[targetgroup_index].port}`,
            port: deploy_spec[i].instance.lb.args[targetgroup_index].port,
            protocol: deploy_spec[i].instance.lb.args[targetgroup_index].protocol,
            vpcId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].instance.vpc] }] })).id,
            tags: { ...deploy_spec[i].instance.tags, ...{ Name: `tc-${deploy_spec[i].instance.group}-${deploy_spec[i].instance.lb.args[targetgroup_index].protocol}-${deploy_spec[i].instance.lb.args[targetgroup_index].port}` } }
        }, { dependsOn: [securitygroup,] });
        // 
        for (var instance_index in deploy_spec[i].instance.name) {
            const targetgroupattachment = new aws.lb.TargetGroupAttachment(`${deploy_spec[i].instance.name[instance_index]}-${deploy_spec[i].instance.lb.args[targetgroup_index].protocol}-${deploy_spec[i].instance.lb.args[targetgroup_index].port}`, {
                targetGroupArn: targetgroup.arn,
                targetId: pulumi.output(aws.ec2.getInstance({ filters: [{ name: "tag:Name", values: [deploy_spec[i].instance.name[instance_index]] }] })).id,
                port: deploy_spec[i].instance.lb.args[targetgroup_index].port,
            }, { dependsOn: [targetgroup] });
        }
        const listener = new aws.lb.Listener(`${deploy_spec[i].instance.lb.args[targetgroup_index].protocol}-${deploy_spec[i].instance.lb.args[targetgroup_index].port}`, {
            loadBalancerArn: loadbalancer.arn,
            protocol: deploy_spec[i].instance.lb.args[targetgroup_index].protocol,
            port: deploy_spec[i].instance.lb.args[targetgroup_index].port,
            defaultActions: [
                { type: "forward", targetGroupArn: targetgroup.arn, }
            ],
        }, { dependsOn: [securitygroup,] });
    }
    // Create EC2 instance.
    for (var instance_index in deploy_spec[i].instance.name) {
        const instance = new aws.ec2.Instance(deploy_spec[i].instance.name[instance_index], {
            ami: pulumi.output(aws.ec2.getAmi({ mostRecent: true, filters: [{ name: "name", values: [deploy_spec[i].instance.ami], }, { name: "virtualization-type", values: [deploy_spec[i].instance.virtualizationType], },], })).id,
            instanceType: deploy_spec[i].instance.instanceType,
            rootBlockDevice: { ...deploy_spec[i].instance.rootBlockDevice, ...{ tags: { ...deploy_spec[i].instance.tags, ...{ Name: `osdisk-${deploy_spec[i].instance.name[instance_index]}` } }, } },
            ebsBlockDevices: deploy_spec[i].instance.ebsBlockDevices,
            keyName: deploy_spec[i].instance.keyName,
            subnetId: pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].instance.subnet] }] })).id,
            tags: { ...deploy_spec[i].instance.tags, ...{ Name: deploy_spec[i].instance.name[instance_index] } },
        }, { dependsOn: [securitygroup,] });
        // Attaches a security group to an Elastic Network Interface.
        const sgattachment = new aws.ec2.NetworkInterfaceSecurityGroupAttachment(deploy_spec[i].instance.name[instance_index], {
            securityGroupId: securitygroup.id,
            networkInterfaceId: instance.primaryNetworkInterfaceId,
        }, { dependsOn: [instance] });
        // Create Elastic IP if Public exposure.
        if (deploy_spec[i].instance.public) {
            const instanceeip = new aws.ec2.Eip(deploy_spec[i].instance.name[instance_index], {
                instance: instance.id,
                vpc: true,
                tags: { ...deploy_spec[i].instance.tags, ...{ Name: `eip-${deploy_spec[i].instance.name[instance_index]}` } }
            }, { dependsOn: [instance] });
        }
    }
}