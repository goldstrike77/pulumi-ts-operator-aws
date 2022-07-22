import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const deploy_spec = [
    {
        routetable: {
            vpc: "vpc-ap-northeast-1-01",
            subnet: [
                "subnet-instance-ap-northeast-1-01",
                "subnet-rds-ap-northeast-1-01",
                "subnet-directory-ap-northeast-1-01",
                "subnet-directory-ap-northeast-1-02",
                "subnet-clientvpn-ap-northeast-1-01"
            ],
            tags: {
                Name: "rtb-public-ap-northeast-1-01",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        },
        natgateway: {
            vpc: "vpc-ap-northeast-1-01",
            internetgateway: "igw-ap-northeast-1-01",
            subnet: "subnet-natgateway-ap-northeast-1-01",
            tags: {
                Name: "natgateway-ap-northeast-1-01",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        },
        clientvpn: {
            domain: "vpn.omygods.com",
            clientCidrBlock: "10.0.0.0/22",
            transportProtocol: "tcp",
            vpnPort: 443,
            sessionTimeoutHours: 8,
            securitygroup: {
                ingress: [{ fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] }],
                egress: [{ fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] }],
            },
            vpc: "vpc-ap-northeast-1-01",
            subnet: "subnet-clientvpn-ap-northeast-1-01",
            cloudwatch: {
                retentionInDays: 3,
            },
            tags: {
                Name: "cvpn-endpoint-ap-northeast-1-01",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        }
    }
]

for (var i in deploy_spec) {
    // Create Virtual Private Cloud NAT Gateway Elastic IP.
    const natgatewayeip = new aws.ec2.Eip(deploy_spec[i].natgateway.tags.Name, {
        vpc: true,
        tags: { ...deploy_spec[i].natgateway.tags, ...{ Name: `eip-${deploy_spec[i].natgateway.tags.Name}` } }
    });
    // Create Virtual Private Cloud NAT Gateway.
    const natgateway = new aws.ec2.NatGateway(deploy_spec[i].natgateway.tags.Name, {
        allocationId: natgatewayeip.id,
        subnetId: pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].natgateway.subnet] }] })).id,
        tags: deploy_spec[i].natgateway.tags
    }, { dependsOn: [natgatewayeip] });
    // Create Virtual Private Cloud routing table.
    const routetable = new aws.ec2.RouteTable(deploy_spec[i].routetable.tags.Name, {
        vpcId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].routetable.vpc] }] })).id,
        routes: [
            { cidrBlock: "0.0.0.0/0", gatewayId: natgateway.id, }
        ],
        tags: deploy_spec[i].routetable.tags
    }, { dependsOn: [natgateway] });
    // Create Routing table association.
    for (var subnet_index in deploy_spec[i].routetable.subnet) {
        const routeTableAssociation = new aws.ec2.RouteTableAssociation(deploy_spec[i].routetable.subnet[subnet_index], {
            subnetId: pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].routetable.subnet[subnet_index]] }] })).id,
            routeTableId: routetable.id
        }, { dependsOn: [routetable] });
    }
    /**
        // Create Client VPN.
        const loggroup = new aws.cloudwatch.LogGroup(deploy_spec[i].clientvpn.tags.Name, {
            retentionInDays: deploy_spec[i].clientvpn.cloudwatch.retentionInDays,
            tags: deploy_spec[i].clientvpn.tags
        });
        const logstream = new aws.cloudwatch.LogStream(deploy_spec[i].clientvpn.tags.Name, {
            logGroupName: loggroup.name
        }, { dependsOn: [loggroup] });
        const securitygroup = new aws.ec2.SecurityGroup(deploy_spec[i].clientvpn.tags.Name, {
            vpcId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].clientvpn.vpc] }] })).id,
            ingress: deploy_spec[i].clientvpn.securitygroup.ingress,
            egress: deploy_spec[i].clientvpn.securitygroup.egress,
            tags: { ...deploy_spec[i].clientvpn.tags, ...{ Name: `sg-${deploy_spec[i].clientvpn.tags.Name}` } }
        }, { dependsOn: [logstream] });
        const endpoint = new aws.ec2clientvpn.Endpoint(deploy_spec[i].clientvpn.tags.Name, {
            serverCertificateArn: pulumi.output(aws.acm.getCertificate({ domain: deploy_spec[i].clientvpn.domain })).arn,
            clientCidrBlock: deploy_spec[i].clientvpn.clientCidrBlock,
            securityGroupIds: [securitygroup.id],
            sessionTimeoutHours: deploy_spec[i].clientvpn.sessionTimeoutHours,
            vpcId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].clientvpn.vpc] }] })).id,
            transportProtocol: deploy_spec[i].clientvpn.transportProtocol,
            vpnPort: deploy_spec[i].clientvpn.vpnPort,
            authenticationOptions: [{
                type: "certificate-authentication",
                rootCertificateChainArn: pulumi.output(aws.acm.getCertificate({ domain: deploy_spec[i].clientvpn.domain })).arn,
            }],
            connectionLogOptions: {
                enabled: true,
                cloudwatchLogGroup: loggroup.name,
                cloudwatchLogStream: logstream.name,
            },
            tags: deploy_spec[i].clientvpn.tags
        }, { dependsOn: [securitygroup] });
        const networkassociation = new aws.ec2clientvpn.NetworkAssociation(deploy_spec[i].clientvpn.tags.Name, {
            clientVpnEndpointId: endpoint.id,
            subnetId: pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].clientvpn.subnet] }] })).id,
        }, { dependsOn: [endpoint] });
        const route = new aws.ec2clientvpn.Route(deploy_spec[i].clientvpn.tags.Name, {
            clientVpnEndpointId: endpoint.id,
            destinationCidrBlock: "0.0.0.0/0",
            targetVpcSubnetId: pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].clientvpn.subnet] }] })).id,
        }, { dependsOn: [networkassociation] });
    */
}