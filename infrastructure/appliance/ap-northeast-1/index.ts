import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const deploy_spec = [
    {
        defaultroutetable: {
            vpc: "vpc-ap-northeast-1-01",
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
        subnetId: pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].natgateway.subnet], }], })).id,
        tags: deploy_spec[i].natgateway.tags
    }, { dependsOn: [natgatewayeip] });
    // Modify Amazon Virtual Private Cloud default routing table.
    const defaultroutetable = new aws.ec2.DefaultRouteTable(deploy_spec[i].defaultroutetable.tags.Name, {
        defaultRouteTableId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].defaultroutetable.vpc], }], })).mainRouteTableId,
        routes: [
            { cidrBlock: "0.0.0.0/0", gatewayId: natgateway.id, }
        ],
        tags: deploy_spec[i].defaultroutetable.tags
    }, { dependsOn: [natgateway] });
}