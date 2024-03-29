import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const deploy_spec = [
    {
        vpc: {
            cidrBlock: "172.32.0.0/16",
            cidrBlockAssociation: ["172.33.0.0/16"],
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                Name: "vpc-ap-northeast-1-01",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        },
        dhcpoptions: {
            domainName: "ap-northeast-1-01.compute.internal",
            domainNameServers: ["AmazonProvidedDNS"],
            tags: {
                Name: "dopt-ap-northeast-1-01",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        },
        internetgateway: {
            tags: {
                Name: "igw-ap-northeast-1-01",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        },
        defaultsecuritygroup: {
            ingress: [
                { protocol: "-1", fromPort: 0, toPort: 0, self: true },
                { cidrBlocks: ["0.0.0.0/0"], protocol: "icmp", fromPort: 8, toPort: 0 }
            ],
            egress: [
                { protocol: "-1", fromPort: 0, toPort: 0, self: true },
                { cidrBlocks: ["0.0.0.0/0"], protocol: "icmp", fromPort: 8, toPort: 0 },
                { cidrBlocks: ["0.0.0.0/0"], protocol: "tcp", fromPort: 80, toPort: 80 },
                { cidrBlocks: ["0.0.0.0/0"], protocol: "tcp", fromPort: 443, toPort: 443 },
                { cidrBlocks: ["0.0.0.0/0"], protocol: "udp", fromPort: 123, toPort: 123 }
            ],
            tags: {
                Name: "sg-default-ap-northeast-1-01",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        },
        subnet: [
            {
                cidrBlock: "172.32.0.0/28",
                mapPublicIpOnLaunch: false,
                availabilityZone: "ap-northeast-1a",
                egress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                ingress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                tags: {
                    Name: "subnet-directory-ap-northeast-1-01",
                    Project: pulumi.getProject(),
                    Stack: pulumi.getStack(),
                },
            },
            {
                cidrBlock: "172.32.0.16/28",
                mapPublicIpOnLaunch: false,
                availabilityZone: "ap-northeast-1c",
                egress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                ingress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                tags: {
                    Name: "subnet-directory-ap-northeast-1-02",
                    Project: pulumi.getProject(),
                    Stack: pulumi.getStack(),
                }
            },
            {
                cidrBlock: "172.32.0.32/28",
                mapPublicIpOnLaunch: false,
                availabilityZone: "ap-northeast-1a",
                egress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                ingress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                tags: {
                    Name: "subnet-clientvpn-ap-northeast-1-01",
                    Project: pulumi.getProject(),
                    Stack: pulumi.getStack(),
                }
            },
            {
                cidrBlock: "172.32.0.48/28",
                mapPublicIpOnLaunch: true,
                availabilityZone: "ap-northeast-1a",
                egress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                ingress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                tags: {
                    Name: "subnet-natgateway-ap-northeast-1-01",
                    Project: pulumi.getProject(),
                    Stack: pulumi.getStack(),
                }
            },
            {
                cidrBlock: "172.32.0.64/28",
                mapPublicIpOnLaunch: true,
                availabilityZone: "ap-northeast-1a",
                egress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                ingress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                tags: {
                    Name: "subnet-bastion-ap-northeast-1-01",
                    Project: pulumi.getProject(),
                    Stack: pulumi.getStack(),
                }
            },
            {
                cidrBlock: "172.32.0.80/28",
                mapPublicIpOnLaunch: true,
                availabilityZone: "ap-northeast-1c",
                egress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                ingress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                tags: {
                    Name: "subnet-bastion-ap-northeast-1-02",
                    Project: pulumi.getProject(),
                    Stack: pulumi.getStack(),
                }
            },
            {
                cidrBlock: "172.32.1.0/24",
                mapPublicIpOnLaunch: false,
                availabilityZone: "ap-northeast-1a",
                egress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                ingress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                tags: {
                    Name: "subnet-instance-ap-northeast-1-01",
                    Project: pulumi.getProject(),
                    Stack: pulumi.getStack(),
                }
            },
            {
                cidrBlock: "172.32.2.0/24",
                mapPublicIpOnLaunch: false,
                availabilityZone: "ap-northeast-1a",
                egress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                ingress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                tags: {
                    Name: "subnet-rds-ap-northeast-1-01",
                    Project: pulumi.getProject(),
                    Stack: pulumi.getStack(),
                }
            }
        ]
    },
    {
        vpc: {
            cidrBlock: "172.34.0.0/16",
            cidrBlockAssociation: ["172.35.0.0/16"],
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                Name: "vpc-ap-northeast-1-02",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        },
        dhcpoptions: {
            domainName: "ap-northeast-1-02.compute.internal",
            domainNameServers: ["AmazonProvidedDNS"],
            tags: {
                Name: "dopt-ap-northeast-1-02",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        },
        internetgateway: {
            tags: {
                Name: "igw-ap-northeast-1-02",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        },
        defaultsecuritygroup: {
            ingress: [
                { protocol: "-1", fromPort: 0, toPort: 0, self: true },
                { cidrBlocks: ["0.0.0.0/0"], protocol: "icmp", fromPort: 8, toPort: 0 }
            ],
            egress: [
                { protocol: "-1", fromPort: 0, toPort: 0, self: true },
                { cidrBlocks: ["0.0.0.0/0"], protocol: "icmp", fromPort: 8, toPort: 0 },
                { cidrBlocks: ["0.0.0.0/0"], protocol: "tcp", fromPort: 80, toPort: 80 },
                { cidrBlocks: ["0.0.0.0/0"], protocol: "tcp", fromPort: 443, toPort: 443 },
                { cidrBlocks: ["0.0.0.0/0"], protocol: "udp", fromPort: 123, toPort: 123 }
            ],
            tags: {
                Name: "sg-default-ap-northeast-1-02",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        },
        subnet: [
            {
                cidrBlock: "172.34.1.0/24",
                mapPublicIpOnLaunch: false,
                availabilityZone: "ap-northeast-1a",
                egress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                ingress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                tags: {
                    Name: "subnet-instance-ap-northeast-1-02",
                    Project: pulumi.getProject(),
                    Stack: pulumi.getStack(),
                }
            },
            {
                cidrBlock: "172.34.2.0/24",
                mapPublicIpOnLaunch: false,
                availabilityZone: "ap-northeast-1a",
                egress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                ingress: [{ protocol: "-1", ruleNo: 100, action: "allow", cidrBlock: "0.0.0.0/0", fromPort: 0, toPort: 0 }],
                tags: {
                    Name: "subnet-rds-ap-northeast-1-02",
                    Project: pulumi.getProject(),
                    Stack: pulumi.getStack(),
                }
            }
        ]
    }
]

for (var i in deploy_spec) {
    // Create Virtual Private Cloud.
    const vpc = new aws.ec2.Vpc(deploy_spec[i].vpc.tags.Name, {
        cidrBlock: deploy_spec[i].vpc.cidrBlock,
        enableDnsHostnames: deploy_spec[i].vpc.enableDnsHostnames,
        enableDnsSupport: deploy_spec[i].vpc.enableDnsSupport,
        tags: deploy_spec[i].vpc.tags
    });
    // Associate additional IPv4 CIDR blocks with a VPC.
    for (var cidrblockassociation_index in deploy_spec[i].vpc.cidrBlockAssociation) {
        const vpcipv4cidrblockassociation = new aws.ec2.VpcIpv4CidrBlockAssociation(deploy_spec[i].vpc.cidrBlockAssociation[cidrblockassociation_index], {
            vpcId: vpc.id,
            cidrBlock: deploy_spec[i].vpc.cidrBlockAssociation[cidrblockassociation_index],
        }, { dependsOn: [vpc] });
    }
    // Create Virtual Private Cloud Default DHCP Options.
    const dhcpoptions = new aws.ec2.VpcDhcpOptions(deploy_spec[i].dhcpoptions.tags.Name, {
        domainName: deploy_spec[i].dhcpoptions.domainName,
        domainNameServers: deploy_spec[i].dhcpoptions.domainNameServers,
        tags: deploy_spec[i].dhcpoptions.tags
    });
    const dhcpoptionsassociation = new aws.ec2.VpcDhcpOptionsAssociation(deploy_spec[i].dhcpoptions.tags.Name, {
        vpcId: vpc.id,
        dhcpOptionsId: dhcpoptions.id,
    }, { dependsOn: [vpc] });
    // Create Virtual Private Cloud Internet Gateway.
    const internetgateway = new aws.ec2.InternetGateway(deploy_spec[i].internetgateway.tags.Name, {
        vpcId: vpc.id,
        tags: deploy_spec[i].internetgateway.tags
    }, { dependsOn: [vpc] });
    // Modify Amazon Virtual Private Cloud default security group.
    const defaultsecuritygroup = new aws.ec2.DefaultSecurityGroup(deploy_spec[i].defaultsecuritygroup.tags.Name, {
        vpcId: vpc.id,
        ingress: deploy_spec[i].defaultsecuritygroup.ingress,
        egress: deploy_spec[i].defaultsecuritygroup.egress,
        tags: deploy_spec[i].defaultsecuritygroup.tags
    }, { dependsOn: [vpc] });
    // Create Subnet, Network Acl.
    for (var subnet_index in deploy_spec[i].subnet) {
        const subnet = new aws.ec2.Subnet(deploy_spec[i].subnet[subnet_index].tags.Name, {
            vpcId: vpc.id,
            mapPublicIpOnLaunch: deploy_spec[i].subnet[subnet_index].mapPublicIpOnLaunch,
            availabilityZone: deploy_spec[i].subnet[subnet_index].availabilityZone,
            cidrBlock: deploy_spec[i].subnet[subnet_index].cidrBlock,
            tags: deploy_spec[i].subnet[subnet_index].tags
        }, { dependsOn: [vpc] });
        const acl = new aws.ec2.NetworkAcl(`acl-${deploy_spec[i].subnet[subnet_index].tags.Name}`, {
            vpcId: vpc.id,
            egress: deploy_spec[i].subnet[subnet_index].egress,
            ingress: deploy_spec[i].subnet[subnet_index].ingress,
            tags: { ...deploy_spec[i].subnet[subnet_index].tags, ...{ Name: `acl-${deploy_spec[i].subnet[subnet_index].tags.Name}` } }
        }, { dependsOn: [subnet] });
        const aclassociation = new aws.ec2.NetworkAclAssociation(`acl-${deploy_spec[i].subnet[subnet_index].tags.Name}`, {
            networkAclId: acl.id,
            subnetId: subnet.id,
        }, { dependsOn: [acl] });
        // Create Subnet Public route table.
        if (deploy_spec[i].subnet[subnet_index].mapPublicIpOnLaunch) {
            const routetable = new aws.ec2.RouteTable(deploy_spec[i].subnet[subnet_index].tags.Name, {
                vpcId: vpc.id,
                routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: internetgateway.id, }],
                tags: { ...deploy_spec[i].subnet[subnet_index].tags, ...{ Name: `rtb-${deploy_spec[i].subnet[subnet_index].tags.Name}` } }
            }, { dependsOn: [aclassociation] });
            const routeTableAssociation = new aws.ec2.RouteTableAssociation(deploy_spec[i].subnet[subnet_index].tags.Name, {
                subnetId: subnet.id,
                routeTableId: routetable.id
            }, { dependsOn: [routetable] });
        }
    }
}