import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const deploy_spec = [
    {
        vpc: {
            cidrBlock: "172.32.0.0/16",
            enableDnsHostnames: true,
            tags: {
                Name: "vpc-ap-northeast-1-01",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        },
        defaultvpcdhcpoptions: {
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
        defaultroutetable: {
            tags: {
                Name: "rtb-ap-northeast-1-01",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        },
        defaultsecuritygroup: {
            ingress: [
                {
                    protocol: "-1",
                    self: true,
                    fromPort: 0,
                    toPort: 0,
                }
            ],
            egress: [
                {
                    fromPort: 0,
                    toPort: 0,
                    protocol: "-1",
                    cidrBlocks: ["0.0.0.0/0"],
                }
            ],
            tags: {
                Name: "sg-ap-northeast-1-01",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        },
        subnet: [
            {
                cidrBlock: "172.32.0.0/24",
                tags: {
                    Name: "subnet-ap-northeast-1-01",
                    Project: pulumi.getProject(),
                    Stack: pulumi.getStack(),
                },
                egress: [
                    {
                        protocol: "tcp",
                        ruleNo: 100,
                        action: "allow",
                        cidrBlock: "0.0.0.0/0",
                        fromPort: 80,
                        toPort: 80,
                    },
                    {
                        protocol: "tcp",
                        ruleNo: 105,
                        action: "allow",
                        cidrBlock: "0.0.0.0/0",
                        fromPort: 443,
                        toPort: 443,
                    },
                    {
                        protocol: "udp",
                        ruleNo: 110,
                        action: "allow",
                        cidrBlock: "0.0.0.0/0",
                        fromPort: 123,
                        toPort: 123,
                    }
                ],
                ingress: [
                    {
                        protocol: "tcp",
                        ruleNo: 100,
                        action: "allow",
                        cidrBlock: "0.0.0.0/0",
                        fromPort: 80,
                        toPort: 80,
                    },
                    {
                        protocol: "tcp",
                        ruleNo: 105,
                        action: "allow",
                        cidrBlock: "0.0.0.0/0",
                        fromPort: 443,
                        toPort: 443,
                    },
                    {
                        protocol: "tcp",
                        ruleNo: 110,
                        action: "allow",
                        cidrBlock: "0.0.0.0/0",
                        fromPort: 22,
                        toPort: 22,
                    }
                ]
            },
            {
                cidrBlock: "172.32.1.0/24",
                tags: {
                    Name: "subnet-ap-northeast-1-02",
                    Project: pulumi.getProject(),
                    Stack: pulumi.getStack(),
                }
            },
            {
                cidrBlock: "172.32.2.0/24",
                tags: {
                    Name: "subnet-ap-northeast-1-03",
                    Project: pulumi.getProject(),
                    Stack: pulumi.getStack(),
                }
            }
        ],
        natgateway: {
            subnet: "subnet-ap-northeast-1-01",
            tags: {
                Name: "natgateway-ap-northeast-1-01",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        }
    }
]

for (var i in deploy_spec) {
    // Create Amazon Virtual Private Cloud.
    const vpc = new aws.ec2.Vpc(deploy_spec[i].vpc.tags.Name, {
        cidrBlock: deploy_spec[i].vpc.cidrBlock,
        enableDnsHostnames: deploy_spec[i].vpc.enableDnsHostnames,
        tags: deploy_spec[i].vpc.tags
    });
    // Modify Amazon Virtual Private Cloud Default DHCP Options.
    const defaultvpcdhcpoptions = new aws.ec2.DefaultVpcDhcpOptions("DefaultVpcDhcpOptions", {
        tags: deploy_spec[i].defaultvpcdhcpoptions.tags
    });
    // Create Amazon Virtual Private Cloud Internet Gateway.
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
    // Create Amazon Subnet & Network Acl.
    for (var subnet_index in deploy_spec[i].subnet) {
        const subnet = new aws.ec2.Subnet(deploy_spec[i].subnet[subnet_index].tags.Name, {
            vpcId: vpc.id,
            cidrBlock: deploy_spec[i].subnet[subnet_index].cidrBlock,
            tags: deploy_spec[i].subnet[subnet_index].tags
        }, { dependsOn: [vpc] });
        const acl = new aws.ec2.NetworkAcl(`acl-${deploy_spec[i].subnet[subnet_index].tags.Name}`, {
            vpcId: vpc.id,
            egress: deploy_spec[i].subnet[subnet_index].egress,
            ingress: deploy_spec[i].subnet[subnet_index].ingress,
            tags: {
                Name: `acl-${deploy_spec[i].subnet[subnet_index].tags.Name}`,
            }
        }, { dependsOn: [subnet] });
        const aclassociation = new aws.ec2.NetworkAclAssociation(`acl-${deploy_spec[i].subnet[subnet_index].tags.Name}`, {
            networkAclId: acl.id,
            subnetId: subnet.id,
        }, { dependsOn: [acl] });
        const routeTableAssociation = new aws.ec2.RouteTableAssociation(deploy_spec[i].subnet[subnet_index].tags.Name, {
            subnetId: subnet.id,
            routeTableId: vpc.defaultRouteTableId
        });
    };
    /**
  // Create Amazon Virtual Private Cloud NAT Gateway.
  const natgatewayeip = new aws.ec2.Eip(deploy_spec[i].natgateway.tags.Name, {
      vpc: true,
      tags: {
          Name: `eip-${deploy_spec[i].natgateway.tags.Name}`,
      }
  }, { dependsOn: [vpc] });
  const natgateway = new aws.ec2.NatGateway(deploy_spec[i].natgateway.tags.Name, {
      allocationId: natgatewayeip.id,
      subnetId: pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].natgateway.subnet], }], })).id,
      tags: deploy_spec[i].natgateway.tags
  }, { dependsOn: [natgatewayeip] });
  // Modify Amazon Virtual Private Cloud default routing table.
  const defaultroutetable = new aws.ec2.DefaultRouteTable(deploy_spec[i].defaultroutetable.tags.Name, {
      defaultRouteTableId: vpc.defaultRouteTableId,
      routes: [
          { cidrBlock: "0.0.0.0/0", gatewayId: natgateway.id, }
      ],
      tags: deploy_spec[i].defaultroutetable.tags
  }, { dependsOn: [natgateway] });
  */
}