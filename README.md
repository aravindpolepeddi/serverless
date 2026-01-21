# Serverless - AWS Lambda Functions

**Author:** Aravind Polepeddi  

## Overview

This repository contains AWS Lambda functions that provide serverless processing capabilities for the CSYE6225 cloud application. The Lambda functions are designed to work in conjunction with the web service API and infrastructure to handle asynchronous tasks, event processing, and background jobs.

## Architecture

This serverless component is part of a three-repository cloud application system:
- **[infrastructure](https://github.com/aravindpolepeddi/infrastructure)** - AWS CloudFormation templates for VPC, networking, Lambda configurations
- **[webservice](https://github.com/aravindpolepeddi/webservice)** - Node.js RESTful API application
- **serverless** (this repo) - AWS Lambda functions for event-driven processing

## Repository Structure

```
serverless/
├── .github/workflows/       # GitHub Actions CI/CD workflows
├── src/                     # Lambda function source code
│   └── index.js            # Main Lambda handler
├── package.json            # Node.js dependencies
├── package-lock.json       # Dependency lock file
├── .gitignore             # Git ignore rules
├── LICENSE                # MIT License
└── README.md              # This file
```

## Tech Stack

- **Runtime:** Node.js (AWS Lambda)
- **Cloud Platform:** AWS Lambda
- **Event Sources:** SNS, SQS, S3, API Gateway (configurable)
- **CI/CD:** GitHub Actions
- **Deployment:** AWS Lambda with CloudFormation or SAM
- **Package Management:** npm

## Use Cases

Lambda functions in this repository typically handle:
- **Email Notifications:** Sending verification emails, alerts, notifications
- **File Processing:** Processing uploaded files from S3
- **Data Transformation:** ETL operations on incoming data
- **Asynchronous Tasks:** Background jobs triggered by API events
- **Event-Driven Processing:** SNS/SQS message processing
- **Scheduled Tasks:** CloudWatch Events for periodic execution

## Lambda Function Structure

### Handler Function

The main Lambda handler is located in `src/index.js`:

```javascript
exports.handler = async (event, context) => {
  // Lambda function logic
  // Process event data
  // Return response
};
```

### Event Sources

Lambda functions can be triggered by:
- **SNS Topics:** Message notifications from web service
- **SQS Queues:** Queue-based processing
- **S3 Events:** Object creation/deletion
- **API Gateway:** HTTP requests
- **CloudWatch Events:** Scheduled execution
- **DynamoDB Streams:** Database change events

## Installation & Development

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/aravindpolepeddi/serverless.git
cd serverless
```

2. Install dependencies:
```bash
npm install
```

3. Run tests locally:
```bash
npm test
```

### Testing Lambda Functions Locally

Use AWS SAM CLI for local testing:

```bash
# Install SAM CLI
brew install aws-sam-cli  # macOS
# or follow AWS SAM installation guide

# Invoke function locally
sam local invoke -e event.json

# Start local API Gateway
sam local start-api
```

## Deployment

### Manual Deployment

1. **Package the function:**
```bash
# Create deployment package
zip -r function.zip src/ node_modules/ package.json
```

2. **Deploy to AWS Lambda:**
```bash
# Using AWS CLI
aws lambda update-function-code \
  --function-name <function-name> \
  --zip-file fileb://function.zip \
  --profile <aws-profile>
```

### Automated Deployment with GitHub Actions

The repository includes GitHub Actions workflows for CI/CD:

1. **On Push/PR:**
   - Install dependencies
   - Run linting
   - Execute tests
   - Validate code quality

2. **On Merge to Main:**
   - Package Lambda function
   - Upload to S3
   - Update Lambda function code
   - Create new version/alias
   - Run integration tests

### CloudFormation Deployment

Lambda functions are deployed as part of the infrastructure stack:

```bash
# Deploy from infrastructure repository
aws cloudformation create-stack \
  --stack-name lambda-stack \
  --template-body file://lambda-template.yml \
  --parameters ParameterKey=LambdaCodeBucket,ParameterValue=<bucket-name> \
  --capabilities CAPABILITY_IAM
```

## Configuration

### Environment Variables

Lambda functions use environment variables for configuration:

- `DB_HOST` - Database endpoint (if connecting to RDS)
- `SNS_TOPIC_ARN` - SNS topic for notifications
- `S3_BUCKET` - S3 bucket for file operations
- `API_ENDPOINT` - Web service API endpoint
- `REGION` - AWS region
- `LOG_LEVEL` - Logging verbosity (DEBUG, INFO, WARN, ERROR)

### IAM Permissions

Lambda execution role requires permissions for:
- CloudWatch Logs (logging)
- SNS (publish messages)
- SQS (send/receive messages)
- S3 (read/write objects)
- RDS (database access via VPC)
- Secrets Manager (retrieve credentials)

Example IAM policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "*"
    }
  ]
}
```

## GitHub Actions Workflow

### Workflow Configuration

The `.github/workflows/` directory contains automated pipelines:

**Build and Test:**
```yaml
- Checkout code
- Setup Node.js
- Install dependencies
- Run unit tests
- Code coverage report
```

**Deploy:**
```yaml
- Build deployment package
- Upload to S3
- Update Lambda function
- Publish new version
- Create/update alias
- Run smoke tests
```

### Required Secrets

Configure these in GitHub repository secrets:
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - Target AWS region
- `LAMBDA_FUNCTION_NAME` - Lambda function name
- `S3_DEPLOYMENT_BUCKET` - S3 bucket for code storage

## Integration with Web Service

### Event Flow

1. **Web service** receives API request
2. **Web service** publishes event to SNS topic
3. **SNS** triggers Lambda function
4. **Lambda** processes event asynchronously
5. **Lambda** updates database or sends notification
6. **Lambda** returns result or error

### Example Integration

Web service publishes SNS message:
```javascript
// In web service (api.js)
const sns = new AWS.SNS();
await sns.publish({
  TopicArn: process.env.SNS_TOPIC_ARN,
  Message: JSON.stringify({
    userId: user.id,
    action: 'email_verification',
    email: user.email
  })
}).promise();
```

Lambda function processes message:
```javascript
// In Lambda (src/index.js)
exports.handler = async (event) => {
  const message = JSON.parse(event.Records[0].Sns.Message);
  // Send verification email
  await sendEmail(message.email, message.userId);
};
```

## Monitoring & Logging

### CloudWatch Logs

Lambda automatically logs to CloudWatch:

```bash
# View logs
aws logs tail /aws/lambda/<function-name> --follow

# Filter logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/<function-name> \
  --filter-pattern "ERROR"
```

### Metrics

Monitor Lambda performance:
- Invocations count
- Error rate
- Duration (execution time)
- Throttles
- Concurrent executions
- Dead letter queue messages

### Alerts

Set up CloudWatch alarms for:
- High error rates
- Long execution times
- Throttling events
- Failed invocations

## Error Handling

### Retry Logic

Lambda automatically retries failed executions:
- **Asynchronous invocation:** 2 retries
- **Event source mapping:** Based on configuration

### Dead Letter Queue

Configure DLQ for failed events:
```javascript
// CloudFormation configuration
DeadLetterConfig:
  TargetArn: !GetAtt MyDLQ.Arn
```

### Error Responses

```javascript
exports.handler = async (event) => {
  try {
    // Process event
    return { statusCode: 200, body: 'Success' };
  } catch (error) {
    console.error('Error:', error);
    // Send to DLQ or error tracking service
    throw error; // Trigger retry
  }
};
```

## Performance Optimization

### Cold Start Reduction

- Keep function code lightweight
- Minimize dependencies
- Use provisioned concurrency for critical functions
- Reuse connections (database, HTTP clients)
- Initialize SDK clients outside handler

### Memory & Timeout

Configure based on workload:
```yaml
MemorySize: 512  # MB (128-10240)
Timeout: 30      # seconds (1-900)
```

### Best Practices

1. **Code Organization:**
   - Separate business logic from handler
   - Use async/await for asynchronous operations
   - Keep handler function simple
   - Modularize code for reusability

2. **Dependencies:**
   - Only include necessary packages
   - Use layer for shared dependencies
   - Keep deployment package under 50MB
   - Consider using Lambda layers

3. **Connections:**
   - Reuse database connections
   - Pool HTTP connections
   - Initialize outside handler
   - Close connections properly

## Testing

### Unit Tests

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

### Integration Tests

Test Lambda with actual AWS services:
```bash
# Deploy to dev environment
npm run deploy:dev

# Run integration tests
npm run test:integration
```

### Sample Test

```javascript
const { handler } = require('./src/index');

test('processes SNS event', async () => {
  const event = {
    Records: [{
      Sns: {
        Message: JSON.stringify({ userId: '123' })
      }
    }]
  };
  
  const result = await handler(event);
  expect(result.statusCode).toBe(200);
});
```

## Security Best Practices

1. **Least Privilege:** Grant minimum required IAM permissions
2. **Secrets Management:** Use AWS Secrets Manager for credentials
3. **VPC Configuration:** Deploy in VPC for RDS access
4. **Encryption:** Enable encryption at rest and in transit
5. **Input Validation:** Validate all event data
6. **Dependency Scanning:** Regularly update and scan dependencies

## Troubleshooting

### Common Issues

1. **Function Timeout:**
   - Increase timeout setting
   - Optimize code performance
   - Check external service latency

2. **Permission Errors:**
   - Review IAM execution role
   - Check resource policies
   - Verify VPC security groups

3. **Cold Start Issues:**
   - Use provisioned concurrency
   - Reduce package size
   - Optimize initialization code

4. **Memory Errors:**
   - Increase memory allocation
   - Check for memory leaks
   - Monitor CloudWatch metrics

## Related Repositories

- **Infrastructure:** [aravindpolepeddi/infrastructure](https://github.com/aravindpolepeddi/infrastructure)
- **Web Service:** [aravindpolepeddi/webservice](https://github.com/aravindpolepeddi/webservice)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement Lambda function logic
4. Write unit tests
5. Update documentation
6. Submit pull request
7. Wait for code review

## Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Node.js on AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
