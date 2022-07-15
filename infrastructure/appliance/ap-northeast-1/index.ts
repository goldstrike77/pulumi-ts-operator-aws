import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const deploy_spec = [
    {
        routetable: {
            vpc: "vpc-ap-northeast-1-01",
            subnet: ["subnet-ap-northeast-1-01", "subnet-ap-northeast-1-02", "subnet-ap-northeast-1-03"],
            tags: {
                Name: "rtb-ap-northeast-1-01",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        },
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
    // Create Amazon Virtual Private Cloud NAT Gateway.
    const natgatewayeip = new aws.ec2.Eip(deploy_spec[i].natgateway.tags.Name, {
        vpc: true,
        tags: {
            Name: `eip-${deploy_spec[i].natgateway.tags.Name}`,
        }
    });
    const natgateway = new aws.ec2.NatGateway(deploy_spec[i].natgateway.tags.Name, {
        allocationId: natgatewayeip.id,
        subnetId: pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].natgateway.subnet] }] })).id,
        tags: deploy_spec[i].natgateway.tags
    }, { dependsOn: [natgatewayeip] });
    // Create Amazon Virtual Private Cloud routing table.
    const routetable = new aws.ec2.RouteTable(deploy_spec[i].routetable.tags.Name, {
        vpcId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].routetable.vpc] }] })).id,
        routes: [
            { cidrBlock: "0.0.0.0/0", gatewayId: natgateway.id, }
        ],
        tags: deploy_spec[i].routetable.tags
    }, { dependsOn: [natgateway] });
    for (var subnet_index in deploy_spec[i].routetable.subnet) {
        const routeTableAssociation = new aws.ec2.RouteTableAssociation(deploy_spec[i].routetable.subnet[subnet_index], {
            subnetId: pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].routetable.subnet[subnet_index]] }] })).id,
            routeTableId: routetable.id
        }, { dependsOn: [routetable] });
    };
}