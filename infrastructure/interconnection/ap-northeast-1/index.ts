import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const deploy_spec = [
    {
        vpcpeeringconnection: {
            peervpc: "vpc-ap-northeast-1-01",
            peervpccidr: "172.32.0.0/16",
            vpc: "vpc-ap-northeast-1-02",
            vpccidr: "172.33.0.0/16",
            autoAccept: true
        }
    }
]

for (var i in deploy_spec) {
    // Create Virtual Private Cloud Peering Connection.
    const vpcpeeringconnection = new aws.ec2.VpcPeeringConnection(`${deploy_spec[i].vpcpeeringconnection.peervpc}-${deploy_spec[i].vpcpeeringconnection.vpc}`, {
        peerVpcId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].vpcpeeringconnection.peervpc], }], })).id,
        vpcId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].vpcpeeringconnection.vpc], }], })).id,
        autoAccept: deploy_spec[i].vpcpeeringconnection.autoAccept,
        tags: {
            Name: `${deploy_spec[i].vpcpeeringconnection.peervpc}-to-${deploy_spec[i].vpcpeeringconnection.vpc}`,
        }
    });
    // Create Route table to Requester VPC.
    const peervpcdefaultroutetable = new aws.ec2.DefaultRouteTable(deploy_spec[i].vpcpeeringconnection.peervpc, {
        defaultRouteTableId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].vpcpeeringconnection.peervpc], }], })).mainRouteTableId,
        routes: [
            { cidrBlock: deploy_spec[i].vpcpeeringconnection.vpccidr, gatewayId: vpcpeeringconnection.id, }
        ]
    }, { dependsOn: [vpcpeeringconnection] });
    // Create Route table to Peering VPC.
    const vpcdefaultroutetable = new aws.ec2.DefaultRouteTable(deploy_spec[i].vpcpeeringconnection.vpc, {
        defaultRouteTableId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].vpcpeeringconnection.vpc], }], })).mainRouteTableId,
        routes: [
            { cidrBlock: deploy_spec[i].vpcpeeringconnection.peervpccidr, gatewayId: vpcpeeringconnection.id, }
        ]
    }, { dependsOn: [vpcpeeringconnection] });
}