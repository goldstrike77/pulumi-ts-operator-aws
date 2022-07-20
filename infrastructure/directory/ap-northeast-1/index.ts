import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const deploy_spec = [
    {
        directory: {
            vpc: "vpc-ap-northeast-1-01",
            subnet: [
                "subnet-directory-ap-northeast-1-01",
                "subnet-directory-ap-northeast-1-02"
            ],
            type: "SimpleAD",
            name: "corp.example.com",
            password: "SuperSecretPassw0rd",
            size: "Small",
            tags: {
                Name: "sg-d-ap-northeast-1-01",
                Project: pulumi.getProject(),
                Stack: pulumi.getStack(),
            }
        }
    }
]

for (var i in deploy_spec) {
    // Create Simple or Managed Microsoft directory in Amazon Directory Service.
    const directory = new aws.directoryservice.Directory(deploy_spec[i].directory.tags.Name, {
        type: deploy_spec[i].directory.type,
        name: deploy_spec[i].directory.name,
        password: deploy_spec[i].directory.password,
        size: deploy_spec[i].directory.size,
        vpcSettings: {
            vpcId: pulumi.output(aws.ec2.getVpc({ filters: [{ name: "tag:Name", values: [deploy_spec[i].directory.vpc] }] })).id,
            subnetIds: [
                pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].directory.subnet[0]] }] })).id,
                pulumi.output(aws.ec2.getSubnet({ filters: [{ name: "tag:Name", values: [deploy_spec[i].directory.subnet[1]] }] })).id
            ]
        },
        tags: deploy_spec[i].directory.tags
    });
}