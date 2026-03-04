
import { Folder, FileCode, Coffee, Globe } from "lucide-react";

export interface ProjectTemplate {
    id: 'python' | 'c' | 'cpp' | 'java' | 'web' | 'node';
    name: string;
    description: string;
    icon: any;
    files: { name: string; content: string }[];
}

export const projectTemplates: ProjectTemplate[] = [
    {
        id: 'python',
        name: 'Python Project',
        description: 'A simple Python script with a main function.',
        icon: FileCode,
        files: [
            {
                name: 'main.py',
                content: `def main():
    print("Hello from Python!")

if __name__ == "__main__":
    main()
`
            },
            {
                name: 'README.md',
                content: '# Python Project\n\nRun `main.py` to start.'
            }
        ]
    },
    {
        id: 'c',
        name: 'C Application',
        description: 'Standard C program with Makefile.',
        icon: FileCode,
        files: [
            {
                name: 'main.c',
                content: `#include <stdio.h>

int main() {
    printf("Hello from C!\\n");
    return 0;
}
`
            },
            {
                name: 'README.md',
                content: '# C Application\n\nCompile and run `main.c`.'
            }
        ]
    },
    {
        id: 'cpp',
        name: 'C++ Application',
        description: 'Standard C++ program.',
        icon: FileCode,
        files: [
            {
                name: 'main.cpp',
                content: `#include <iostream>

int main() {
    std::cout << "Hello from C++!" << std::endl;
    return 0;
}
`
            },
            {
                name: 'README.md',
                content: '# C++ Application\n\nCompile and run `main.cpp`.'
            }
        ]
    },
    {
        id: 'java',
        name: 'Java Application',
        description: 'A simple Java class with a main method.',
        icon: Coffee,
        files: [
            {
                name: 'Main.java',
                content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}
`
            },
            {
                name: 'README.md',
                content: '# Java Application\n\nThis project contains a `Main` class.'
            }
        ]
    },
    {
        id: 'node',
        name: 'Node.js App',
        description: 'Simple Node.js application.',
        icon: FileCode,
        files: [
            {
                name: 'index.js',
                content: `const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello from Node.js!\\n');
});

server.listen(PORT, () => {
    console.log(\`Server running at http://localhost:\${PORT}/\`);
});
`
            },
            {
                name: 'app.js',
                content: `// Simple Node.js application

function greet(name) {
    return \`Hello, \${name}!\`;
}

// Read from command line arguments
const name = process.argv[2] || 'World';
console.log(greet(name));

// Simple array operations
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log(\`Sum of \${numbers}: \${sum}\`);
`
            },
            {
                name: 'README.md',
                content: '# Node.js App\n\nRun `node app.js` to start.'
            }
        ]
    },
    {
        id: 'web',
        name: 'Web Site',
        description: 'HTML, CSS, and JavaScript starter.',
        icon: Globe,
        files: [
            {
                name: 'index.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello World</h1>
    <script src="script.js"></script>
</body>
</html>
`
            },
            {
                name: 'style.css',
                content: `body {
    font-family: sans-serif;
    background-color: #f0f0f0;
    color: #333;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}
`
            },
            {
                name: 'script.js',
                content: `console.log("Hello from JavaScript!");`
            }
        ]
    }
];
