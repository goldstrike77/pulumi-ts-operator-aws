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
                Name: "nat-ap-northeast-1-01",
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
}