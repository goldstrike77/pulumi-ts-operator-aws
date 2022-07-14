import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const deploy_spec = [
    /**
        {
            instance: {
                name: [
                    "demo-web-01",
                    "demo-web-02"
                ],
                ami: "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*",
                virtualizationType: "hvm",
                instanceType: "t2.micro",
                rootBlockDevice: {
                    volumeSize: 8,
                    volumeType: "gp2"
                },
                ebsBlockDevices: [
                    {
                        deviceName: "/dev/sdb",
                        volumeSize: 30,
                        volumeType: "gp2"
                    }
                ],
                public: false,
                subnet: "subnet-ap-northeast-1-03",
                keyName: "pulumi-ts-operator-aws",
                tags: {
                    Project: pulumi.getProject(),
                    Stack: pulumi.getStack(),
                }
            }
        },
    */
    {
        instance: {
            name: [
                "demo-bst-01",
            ],
            ami: "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*",
            virtualizationType: "hvm",
            instanceType: "t2.micro",
            rootBlockDevice: {
                volumeSize: 8,
                volumeType: "gp2"
            },
            ebsBlockDevices: [
                {
                    deviceName: "/dev/sdb",
                    volumeSize: 30,
                    volumeType: "gp2"
                },
                {
                    deviceName: "/dev/sdc",
                    volumeSize: 30,
                    volumeType: "gp2"
                }
            ],
            public: true,
            subnet: "subnet-ap-northeast-1-01",
            keyName: "pulumi-ts-operator-aws",
            tags: {
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        }
    }
]

for (var i in deploy_spec) {
    // Create Amazon EC2 instance.
    for (var instance_index in deploy_spec[i].instance.name) {
        const instance = new aws.ec2.Instance(deploy_spec[i].instance.name[instance_index], {
            ami: pulumi.output(aws.ec2.getAmi({ mostRecent: true, filters: [{ name: "name", values: [deploy_spec[i].instance.ami], }, { name: "virtualization-type", values: [deploy_spec[i].instance.virtualizationType], },], })).id,
            instanceType: deploy_spec[i].instance.instanceType,
            rootBlockDevice: { ...deploy_spec[i].instance.rootBlockDevice, ...{ tags: { ...deploy_spec[i].instance.tags, ...{ Name: deploy_spec[i].instance.name[instance_index] } }, } },
            ebsBlockDevices: deploy_spec[i].instance.ebsBlockDevices,
            keyName: deploy_spec[i].instance.keyName,
            subnetId: pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].instance.subnet], }], })).id,
            tags: { ...deploy_spec[i].instance.tags, ...{ Name: deploy_spec[i].instance.name[instance_index] } },
        });
        if (deploy_spec[i].instance.public) {
            const instanceeip = new aws.ec2.Eip(deploy_spec[i].instance.name[instance_index], {
                instance: instance.id,
                vpc: true,
                tags: { ...deploy_spec[i].instance.tags, ...{ Name: `eip-${deploy_spec[i].instance.name[instance_index]}` } }
            });
        }
    }
}