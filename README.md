# Deploying Express.js on AWS Lambda via GitHub Actions and CloudFormation

## Tech Stack

This article outlines the deployment process utilizing a combination of modern tools and frameworks to ensure a seamless and efficient deployment pipeline. The key technologies used in this project include:

- **pnpm:** A fast, disk space efficient package manager, used for managing project dependencies.
- **Express.js:** A minimal and flexible Node.js web application framework, serving as the backbone for building our RESTful API.
- **DynamoDB:** A NoSQL database service provided by Amazon Web Services (AWS), used for storing application data.
- **Webpack:** A static module bundler for JavaScript applications, used to bundle and optimize the project's files.
- **GitHub Actions:** A CI/CD platform to automate the build, test, and deployment workflows directly from GitHub.
- **CloudFormation:** An AWS service that provides infrastructure as code, used to automate the deployment of resources in a safe and repeatable manner.
- **ESM (changed to CommonJS):** Initially, the project utilized ECMAScript modules (ESM) for a more modern approach to JavaScript modules, but due to compatibility issues, it was switched back to CommonJS.
- **HTTPS:** A secure protocol used to encrypt communication between the client and server, ensuring data privacy and integrity. In this project, it is crucial for securing API requests and responses, especially when handling sensitive information.

## Introduction

In this project, I am working on deploying a RESTful API built with Express.js, which is currently hosted on GitHub, in a serverless architecture on AWS. The motivation behind choosing a serverless approach includes the benefits of cost-effectiveness and automatic scalability that AWS Lambda offers. After conducting thorough research, I have outlined the steps necessary to achieve this deployment, leveraging AWS's robust ecosystem and integrating Continuous Integration/Continuous Deployment (CI/CD) practices for streamlined development workflows.

## Deployment Process

The deployment process involves several key steps:

- **Preparation of the Express.js Application:** The first step is to ensure that the Express.js application is adapted to run in the AWS Lambda environment. This often involves minor modifications to the application code to handle serverless execution.
- **Packaging the Application:** The Express.js application needs to be packaged into a ZIP file. This packaging process includes all the necessary dependencies required for the application to run.
- **Uploading to Amazon S3:** Once the application is packaged, the ZIP file is uploaded to an Amazon S3 (Simple Storage Service) bucket. Amazon S3 serves as a storage solution that AWS Lambda can access to fetch the application code.
- **Setting Up AWS Lambda:** With the code uploaded to S3, the next step is to configure an AWS Lambda function. This function is set up to execute the Express.js application. It involves specifying the runtime environment, memory, timeout settings, and the S3 bucket location of the ZIP file.
- **Integrating with Amazon API Gateway:** To expose the Lambda function as a RESTful API, Amazon API Gateway is used. API Gateway acts as a front door to manage incoming API requests and route them to the appropriate Lambda function for execution.
- **Implementing CI/CD with GitHub Actions:** To automate the deployment process, GitHub Actions is employed. It allows for the automation of packaging and uploading the application to S3, updating the Lambda function, and managing API Gateway configurations upon every code push to the GitHub repository, ensuring a seamless and efficient deployment pipeline.

## Challenges and Solutions

### Challenge 1: Overcoming AWS Lambda's Deployment Package Size Limit

#### The Problem

Early in the deployment process, I encountered a significant hurdle: the size of my Express.js API's deployment package. AWS Lambda imposes a strict limit on the deployment package size; it must be no more than 250MB (unzipped), including all layers and dependencies. My initial deployment package size exceeded this limit, clocking in at over 250MB, which presented a roadblock to deploying my application.

#### Solution and Outcome

Upon reviewing my `package.json`, I discovered that the `googleapis` package, a large dependency, was a major contributor to the package size. By replacing it with more specific, lightweight alternatives, I managed to reduce the dependency size from over 100MB to less than 1M, bringing the overall package size well within Lambda's constraints. This strategic change not only complied with AWS Lambda's requirements but also highlighted the value of efficient dependency management for optimizing application performance and deployment feasibility.

### Challenge 2: Resolving Dependency Resolution Issues with AWS Lambda and pnpm

#### The Problem

During deployment to AWS Lambda, I encountered a critical issue where certain packages could not find their dependencies. This problem was rooted in my use of pnpm for managing dependencies. Unlike npm and Yarn, which create a flat `node_modules` structure, pnpm creates a non-flat, or nested, structure. AWS Lambda, however, expects a flat `node_modules` structure to properly locate and use packages, leading to the mentioned issues.

#### Solution and Outcome

To overcome this challenge, I leveraged a technique of packaging all dependencies together with the application code into a single file. By doing so, the structure of `node_modules` became irrelevant, effectively bypassing the issue caused by pnpm's nested directories. An additional benefit of this approach was a significant reduction in the size of the deployment package: from 30MB prior to packaging to just a few hundred kilobytes afterward. This solution not only resolved the dependency resolution issue but also greatly optimized the deployment package size, making it more efficient for Lambda execution.

### Challenge 3: Handling Webpack Errors with Native Add-ons

#### The Problem

While solving the previous issue by bundling dependencies with Webpack, a new problem emerged related to `@mapbox/node-pre-gyp`, a dependency of the `bcrypt` package. `bcrypt` uses native add-ons for enhanced performance, but Webpack, designed to bundle JavaScript modules, struggles with native modules because it attempts to convert all dependencies into JavaScript. This incompatibility resulted in errors during the bundling process, hindering the deployment.

#### Solution and Outcome

To circumvent the issue with native add-ons, I opted to replace `bcrypt` with `bcryptjs`, a pure JavaScript library that offers similar functionality without relying on native modules. This switch eliminated the errors Webpack was throwing, as `bcryptjs` seamlessly integrates with the JavaScript bundling process. Besides resolving the immediate bundling issue, this change also simplified the deployment process by removing the need for special handling of native modules, ensuring a smoother integration with AWS Lambda's environment.

### Challenge 4: Resolving Module Resolution Issues in AWS Lambda

#### The Problem

Despite everything appearing correctly configured, AWS Lambda was unable to find the module `rest-api`. The root of this issue was traced back to the naming convention used for the bundled output file. My Webpack configuration generated an output file named `dist/rest-api.bundle.js`, and I accordingly set the Lambda handler to `rest-api.bundle.handler`. However, Lambda was still unable to locate the module, despite local tests indicating no issues.

#### Solution and Outcome

Through further investigation and testing, I discovered that the issue was related to AWS Lambda's handling of file names. Specifically, Lambda encountered difficulties with the naming format that included a middle file name, as used in `rest-api.bundle.js`. To address this, I renamed the output file to `rest-api-bundle.js`, aligning with a naming convention that Lambda could interpret correctly. This modification resolved the module resolution issue, allowing Lambda to successfully locate and execute the `rest-api` module as intended.

### Challenge 5: Ensuring Compatibility with AWS Lambda's Module System

#### The Problem

My application was developed using ES modules, a modern JavaScript feature that enables a more organized and efficient way to manage code dependencies. However, during deployment, I faced issues when executing the bundled code on AWS Lambda, which, by default, expects modules to be in CommonJS format. This discrepancy led to execution errors, as Lambda could not correctly interpret the ES module syntax.

#### Solution and Outcome

To resolve this issue, I leveraged a simple yet effective solution: changing the file extension of the bundled output file to `.mjs`. This extension explicitly signifies that the file uses ES module syntax, providing a cue to the runtime environment on how to handle the module. By making this adjustment in the Webpack configuration to output the bundle with a `.mjs` extension, I successfully bridged the compatibility gap between my ES module-based code and AWS Lambda's expectations.

webpack.config.js for esm

    
    import path from 'path';
    import { fileURLToPath } from 'url';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    export default {
        entry: './lambda.js',
        target: 'node',
        module: {
            rules: [
                {
                    test: /\.js$/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env'],
                        },
                    },
                },
            ],
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'rest-api-bundle.mjs', // Output bundle file,
            module: true,
            library: {
                type: 'module',
            },
            chunkFormat: 'array-push',
        },
        experiments: {
            outputModule: true,
        }
    };
    


### Challenge 6: Integrating Swagger Documentation with ESM and Switching Back to CommonJS

#### The Problem

The addition of Swagger documentation to enhance our API's usability and accessibility introduced a new challenge. Swagger, particularly the `swagger-express-ui` package we chose for integrating Swagger UI with our Express.js application, revealed compatibility issues with ES module (ESM) syntax. Specifically, the package's reliance on `__dirname`, a global variable in Node.js that represents the directory name of the current module, became problematic after transpiling code from CommonJS (CJS) to ESM. This issue was emblematic of broader compatibility challenges we faced with ESM in the Node.js ecosystem, which added layers of complexity to our deployment process.

#### The Decision

Given the accumulated complexities and ongoing compatibility issues with ESM, including those affecting crucial tools like Swagger, we made a strategic decision to revert our application to use the CommonJS module system. This decision was not made lightly but was influenced by our experiences and the recognition that ESM support in the Node.js ecosystem, while improving, still presents challenges that can complicate deployment and runtime execution, especially in serverless environments like AWS Lambda.

#### Solution and Outcome

Transitioning back to CommonJS significantly streamlined our deployment flow and resolved the immediate compatibility issues with `swagger-express-ui`. This switch also mitigated the complexities we previously encountered with bundling and executing ESM-based code on AWS Lambda. By aligning our application with the CommonJS module system, we were able to leverage the more widely supported and stable features of the Node.js ecosystem, ensuring smoother integration with tools and libraries essential for our application's functionality and documentation.

This experience underscores the importance of carefully considering the trade-offs between adopting newer development paradigms, like ESM, and the operational realities of the current software ecosystem. It also highlights the need for flexibility and adaptability in technology choices, ensuring that the chosen approach aligns with both the project's requirements and the ecosystem's current state of support.

## Testing the Serverless Application Locally

To ensure the functionality and reliability of your serverless application before deploying it to AWS Lambda, it's important to test it in a local environment. This project uses HTTPS for secure communication, which requires additional steps to set up locally. Follow these instructions to test your serverless app locally:

1. **Install mkcert:** mkcert is a tool that creates a local certificate authority (CA) for you, making it easy to generate SSL certificates for local development. If you haven't installed mkcert yet, follow the instructions on its [GitHub page](https://github.com/FiloSottile/mkcert) to do so.

2. **Generate SSL Certificates:** Once mkcert is installed, generate the certificates needed for HTTPS. Open your terminal and run the following command:

   ```shell
   mkcert -cert-file cert.pem -key-file key.pem localhost
    ````

This command generates two files: `cert.pem` and `cert-key.pem`, which are your local CA's certificate and key, respectively.

3. **Build the Project:** Before running your serverless application locally, build it using the following command:

   ```shell
   pnpm run build
   ```

4. **Start the Serverless Offline Plugin:** With the certificates ready and the project built, you can start the serverless application locally using the Serverless Offline plugin. Make sure to replace `/absolute/path/to/your/current/folder` with the actual absolute path to your project directory:

   ```shell
   ABSOLUTE_DIR=/absolute/path/to/your/current/folder serverless offline
   ```

5. **Access the Local Server:** Your serverless service is now available at `http://localhost:4000/local/hello`. You can access this URL in your browser or use tools like Postman to make requests to your API.

6. **Verify Locally:** It's crucial to verify that your serverless application works as expected in this local setup before proceeding with deployment to AWS Lambda. Test all endpoints and functionalities to ensure everything operates correctly under the local HTTPS configuration.

By following these steps, you can test your serverless application locally, ensuring it behaves as expected before deploying it to a live environment. This process is vital for identifying and fixing any issues early in the development cycle.
