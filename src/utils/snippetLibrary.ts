/**
 * Snippet Library — Common code templates for CS students
 * Organized by language and category for quick insertion.
 */

export interface CodeSnippet {
    id: string;
    title: string;
    description: string;
    language: string;         // Monaco language id
    category: string;
    code: string;
}

// ─── Categories ──────────────────────────────────────────────
export const snippetCategories = [
    'Hello World',
    'Input / Output',
    'Conditionals',
    'Loops',
    'Functions',
    'Arrays & Lists',
    'Strings',
    'Classes & Structs',
    'File I/O',
    'Error Handling',
    'Sorting',
    'Data Structures',
] as const;

export type SnippetCategory = typeof snippetCategories[number];

// ─── Python Snippets ─────────────────────────────────────────
const pythonSnippets: CodeSnippet[] = [
    {
        id: 'py-hello', title: 'Hello World', description: 'Print a greeting',
        language: 'python', category: 'Hello World',
        code: `print("Hello, World!")\n`,
    },
    {
        id: 'py-input', title: 'User Input', description: 'Read input from keyboard',
        language: 'python', category: 'Input / Output',
        code: `name = input("Enter your name: ")
age = int(input("Enter your age: "))
print(f"Hello {name}, you are {age} years old!")
`,
    },
    {
        id: 'py-if', title: 'If-Else', description: 'Conditional branching',
        language: 'python', category: 'Conditionals',
        code: `number = int(input("Enter a number: "))

if number > 0:
    print("Positive")
elif number < 0:
    print("Negative")
else:
    print("Zero")
`,
    },
    {
        id: 'py-for', title: 'For Loop', description: 'Iterate with a for loop',
        language: 'python', category: 'Loops',
        code: `# Loop through a range
for i in range(1, 11):
    print(f"Number: {i}")

# Loop through a list
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)
`,
    },
    {
        id: 'py-while', title: 'While Loop', description: 'Loop with a condition',
        language: 'python', category: 'Loops',
        code: `count = 1
while count <= 5:
    print(f"Count: {count}")
    count += 1
`,
    },
    {
        id: 'py-func', title: 'Function', description: 'Define and call a function',
        language: 'python', category: 'Functions',
        code: `def greet(name):
    """Greet a person by name."""
    return f"Hello, {name}!"

def add(a, b):
    """Add two numbers."""
    return a + b

# Call the functions
print(greet("Alice"))
print(f"3 + 5 = {add(3, 5)}")
`,
    },
    {
        id: 'py-list', title: 'List Operations', description: 'Common list methods',
        language: 'python', category: 'Arrays & Lists',
        code: `numbers = [3, 1, 4, 1, 5, 9, 2, 6]

numbers.append(7)       # Add to end
numbers.insert(0, 10)   # Insert at index
numbers.remove(1)       # Remove first occurrence
popped = numbers.pop()  # Remove and return last

print(f"Length: {len(numbers)}")
print(f"Sorted: {sorted(numbers)}")
print(f"Sum: {sum(numbers)}")
print(f"Min: {min(numbers)}, Max: {max(numbers)}")

# List comprehension
squares = [x**2 for x in range(1, 6)]
print(f"Squares: {squares}")
`,
    },
    {
        id: 'py-dict', title: 'Dictionary', description: 'Key-value pairs',
        language: 'python', category: 'Data Structures',
        code: `student = {
    "name": "Alice",
    "age": 20,
    "grade": "A"
}

# Access
print(student["name"])
print(student.get("phone", "N/A"))

# Iterate
for key, value in student.items():
    print(f"{key}: {value}")

# Modify  
student["age"] = 21
student["phone"] = "555-0123"
`,
    },
    {
        id: 'py-class', title: 'Class', description: 'Object-oriented programming',
        language: 'python', category: 'Classes & Structs',
        code: `class Student:
    def __init__(self, name, age):
        self.name = name
        self.age = age
        self.grades = []

    def add_grade(self, grade):
        self.grades.append(grade)

    def average(self):
        if not self.grades:
            return 0
        return sum(self.grades) / len(self.grades)

    def __str__(self):
        return f"{self.name} (age {self.age}), avg: {self.average():.1f}"

# Usage
s = Student("Alice", 20)
s.add_grade(85)
s.add_grade(92)
s.add_grade(78)
print(s)
`,
    },
    {
        id: 'py-file', title: 'File Read/Write', description: 'Read and write text files',
        language: 'python', category: 'File I/O',
        code: `# Write to a file
with open("output.txt", "w") as f:
    f.write("Hello, File!\\n")
    f.write("Line 2\\n")

# Read from a file
with open("output.txt", "r") as f:
    content = f.read()
    print(content)

# Read line by line
with open("output.txt", "r") as f:
    for line in f:
        print(line.strip())
`,
    },
    {
        id: 'py-try', title: 'Try-Except', description: 'Handle errors gracefully',
        language: 'python', category: 'Error Handling',
        code: `try:
    number = int(input("Enter a number: "))
    result = 10 / number
    print(f"Result: {result}")
except ValueError:
    print("That's not a valid number!")
except ZeroDivisionError:
    print("Cannot divide by zero!")
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    print("Done!")
`,
    },
    {
        id: 'py-sort', title: 'Sorting', description: 'Sort lists and custom objects',
        language: 'python', category: 'Sorting',
        code: `# Simple sort
numbers = [64, 25, 12, 22, 11]
numbers.sort()
print(f"Sorted: {numbers}")

# Sort with key
words = ["banana", "apple", "cherry", "date"]
words.sort(key=len)
print(f"By length: {words}")

# Bubble sort (manual implementation)
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

data = [64, 34, 25, 12, 22, 11, 90]
print(f"Bubble sort: {bubble_sort(data)}")
`,
    },
    {
        id: 'py-string', title: 'String Methods', description: 'Common string operations',
        language: 'python', category: 'Strings',
        code: `text = "Hello, World!"

print(text.upper())        # HELLO, WORLD!
print(text.lower())        # hello, world!
print(text.replace("World", "Python"))
print(text.split(", "))    # ['Hello', 'World!']
print(text.strip())        # Remove whitespace
print(text.find("World"))  # 7 (index)
print(len(text))           # 13
print(text[0:5])           # Hello (slicing)
print(text[::-1])          # Reverse

# f-string formatting
name = "Alice"
score = 95.5
print(f"{name} scored {score:.1f}%")
`,
    },
];

// ─── C Snippets ──────────────────────────────────────────────
const cSnippets: CodeSnippet[] = [
    {
        id: 'c-hello', title: 'Hello World', description: 'Basic C program',
        language: 'c', category: 'Hello World',
        code: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`,
    },
    {
        id: 'c-input', title: 'scanf Input', description: 'Read user input with scanf',
        language: 'c', category: 'Input / Output',
        code: `#include <stdio.h>

int main() {
    char name[50];
    int age;

    printf("Enter your name: ");
    scanf("%s", name);

    printf("Enter your age: ");
    scanf("%d", &age);

    printf("Hello %s, you are %d years old!\\n", name, age);
    return 0;
}
`,
    },
    {
        id: 'c-if', title: 'If-Else', description: 'Conditional branching in C',
        language: 'c', category: 'Conditionals',
        code: `#include <stdio.h>

int main() {
    int number;
    printf("Enter a number: ");
    scanf("%d", &number);

    if (number > 0) {
        printf("Positive\\n");
    } else if (number < 0) {
        printf("Negative\\n");
    } else {
        printf("Zero\\n");
    }
    return 0;
}
`,
    },
    {
        id: 'c-for', title: 'For Loop', description: 'Loop with a counter',
        language: 'c', category: 'Loops',
        code: `#include <stdio.h>

int main() {
    // Print numbers 1 to 10
    for (int i = 1; i <= 10; i++) {
        printf("%d ", i);
    }
    printf("\\n");

    // Multiplication table
    int n = 5;
    for (int i = 1; i <= 10; i++) {
        printf("%d x %d = %d\\n", n, i, n * i);
    }
    return 0;
}
`,
    },
    {
        id: 'c-while', title: 'While Loop', description: 'Loop with a condition',
        language: 'c', category: 'Loops',
        code: `#include <stdio.h>

int main() {
    int count = 1;
    while (count <= 5) {
        printf("Count: %d\\n", count);
        count++;
    }

    // do-while: executes at least once
    int num;
    do {
        printf("Enter a positive number: ");
        scanf("%d", &num);
    } while (num <= 0);

    printf("You entered: %d\\n", num);
    return 0;
}
`,
    },
    {
        id: 'c-func', title: 'Functions', description: 'Define and call functions',
        language: 'c', category: 'Functions',
        code: `#include <stdio.h>

// Function declaration
int add(int a, int b);
void swap(int *a, int *b);

int main() {
    printf("3 + 5 = %d\\n", add(3, 5));

    int x = 10, y = 20;
    printf("Before swap: x=%d, y=%d\\n", x, y);
    swap(&x, &y);
    printf("After swap:  x=%d, y=%d\\n", x, y);
    return 0;
}

int add(int a, int b) {
    return a + b;
}

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}
`,
    },
    {
        id: 'c-array', title: 'Arrays', description: 'Array declaration and traversal',
        language: 'c', category: 'Arrays & Lists',
        code: `#include <stdio.h>

int main() {
    int numbers[] = {5, 3, 8, 1, 9, 2, 7};
    int n = sizeof(numbers) / sizeof(numbers[0]);

    // Print all elements
    printf("Array: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", numbers[i]);
    }
    printf("\\n");

    // Find max and min
    int max = numbers[0], min = numbers[0];
    for (int i = 1; i < n; i++) {
        if (numbers[i] > max) max = numbers[i];
        if (numbers[i] < min) min = numbers[i];
    }
    printf("Max: %d, Min: %d\\n", max, min);
    return 0;
}
`,
    },
    {
        id: 'c-pointer', title: 'Pointers', description: 'Pointer basics',
        language: 'c', category: 'Data Structures',
        code: `#include <stdio.h>
#include <stdlib.h>

int main() {
    // Basic pointer
    int x = 42;
    int *ptr = &x;
    printf("Value: %d\\n", *ptr);    // 42
    printf("Address: %p\\n", ptr);

    // Dynamic memory
    int n = 5;
    int *arr = (int *)malloc(n * sizeof(int));
    if (arr == NULL) {
        printf("Memory allocation failed!\\n");
        return 1;
    }

    for (int i = 0; i < n; i++) {
        arr[i] = (i + 1) * 10;
    }

    printf("Dynamic array: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");

    free(arr);  // Don't forget to free!
    return 0;
}
`,
    },
    {
        id: 'c-struct', title: 'Structs', description: 'Custom data types with struct',
        language: 'c', category: 'Classes & Structs',
        code: `#include <stdio.h>
#include <string.h>

struct Student {
    char name[50];
    int age;
    float gpa;
};

void printStudent(struct Student s) {
    printf("Name: %s, Age: %d, GPA: %.2f\\n", s.name, s.age, s.gpa);
}

int main() {
    struct Student s1;
    strcpy(s1.name, "Alice");
    s1.age = 20;
    s1.gpa = 3.8;

    printStudent(s1);

    // Array of structs
    struct Student class[3] = {
        {"Alice", 20, 3.8},
        {"Bob", 21, 3.5},
        {"Charlie", 19, 3.9}
    };

    for (int i = 0; i < 3; i++) {
        printStudent(class[i]);
    }
    return 0;
}
`,
    },
    {
        id: 'c-string', title: 'String Operations', description: 'C string functions',
        language: 'c', category: 'Strings',
        code: `#include <stdio.h>
#include <string.h>

int main() {
    char str1[50] = "Hello";
    char str2[50] = "World";
    char result[100];

    // String length
    printf("Length: %lu\\n", strlen(str1));

    // String copy
    strcpy(result, str1);
    printf("Copy: %s\\n", result);

    // String concatenation
    strcat(result, " ");
    strcat(result, str2);
    printf("Concat: %s\\n", result);

    // String comparison
    if (strcmp(str1, str2) == 0) {
        printf("Strings are equal\\n");
    } else {
        printf("Strings are different\\n");
    }
    return 0;
}
`,
    },
    {
        id: 'c-file', title: 'File I/O', description: 'Read and write files',
        language: 'c', category: 'File I/O',
        code: `#include <stdio.h>

int main() {
    // Write to file
    FILE *fp = fopen("output.txt", "w");
    if (fp == NULL) {
        printf("Error opening file!\\n");
        return 1;
    }
    fprintf(fp, "Hello, File!\\n");
    fprintf(fp, "Line 2\\n");
    fclose(fp);

    // Read from file
    fp = fopen("output.txt", "r");
    if (fp == NULL) {
        printf("Error opening file!\\n");
        return 1;
    }
    char line[100];
    while (fgets(line, sizeof(line), fp) != NULL) {
        printf("%s", line);
    }
    fclose(fp);
    return 0;
}
`,
    },
    {
        id: 'c-sort', title: 'Bubble Sort', description: 'Sort an array of integers',
        language: 'c', category: 'Sorting',
        code: `#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

void printArray(int arr[], int n) {
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr) / sizeof(arr[0]);

    printf("Before: ");
    printArray(arr, n);

    bubbleSort(arr, n);

    printf("After:  ");
    printArray(arr, n);
    return 0;
}
`,
    },
];

// ─── C++ Snippets ────────────────────────────────────────────
const cppSnippets: CodeSnippet[] = [
    {
        id: 'cpp-hello', title: 'Hello World', description: 'Basic C++ program',
        language: 'cpp', category: 'Hello World',
        code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
    },
    {
        id: 'cpp-input', title: 'cin Input', description: 'Read input with cin',
        language: 'cpp', category: 'Input / Output',
        code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string name;
    int age;

    cout << "Enter your name: ";
    getline(cin, name);

    cout << "Enter your age: ";
    cin >> age;

    cout << "Hello " << name << ", you are " << age << " years old!" << endl;
    return 0;
}
`,
    },
    {
        id: 'cpp-for', title: 'For Loop', description: 'Loop with range-based for',
        language: 'cpp', category: 'Loops',
        code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Classic for loop
    for (int i = 1; i <= 10; i++) {
        cout << i << " ";
    }
    cout << endl;

    // Range-based for loop (C++11)
    vector<string> fruits = {"apple", "banana", "cherry"};
    for (const auto& fruit : fruits) {
        cout << fruit << endl;
    }
    return 0;
}
`,
    },
    {
        id: 'cpp-vector', title: 'Vector', description: 'Dynamic array with std::vector',
        language: 'cpp', category: 'Arrays & Lists',
        code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> nums = {5, 3, 8, 1, 9};

    nums.push_back(7);      // Add to end
    nums.insert(nums.begin(), 10);  // Insert at front

    cout << "Size: " << nums.size() << endl;
    cout << "Front: " << nums.front() << ", Back: " << nums.back() << endl;

    // Sort
    sort(nums.begin(), nums.end());

    // Print
    cout << "Sorted: ";
    for (int n : nums) {
        cout << n << " ";
    }
    cout << endl;

    // Find
    auto it = find(nums.begin(), nums.end(), 8);
    if (it != nums.end()) {
        cout << "Found 8 at index " << (it - nums.begin()) << endl;
    }
    return 0;
}
`,
    },
    {
        id: 'cpp-class', title: 'Class', description: 'OOP with class and methods',
        language: 'cpp', category: 'Classes & Structs',
        code: `#include <iostream>
#include <string>
#include <vector>
using namespace std;

class Student {
private:
    string name;
    int age;
    vector<int> grades;

public:
    Student(string n, int a) : name(n), age(a) {}

    void addGrade(int g) { grades.push_back(g); }

    double average() const {
        if (grades.empty()) return 0;
        int sum = 0;
        for (int g : grades) sum += g;
        return (double)sum / grades.size();
    }

    void display() const {
        cout << name << " (age " << age << "), avg: " << average() << endl;
    }
};

int main() {
    Student s("Alice", 20);
    s.addGrade(85);
    s.addGrade(92);
    s.addGrade(78);
    s.display();
    return 0;
}
`,
    },
    {
        id: 'cpp-string', title: 'String Operations', description: 'std::string methods',
        language: 'cpp', category: 'Strings',
        code: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    string text = "Hello, World!";

    cout << "Length: " << text.length() << endl;
    cout << "Substr: " << text.substr(0, 5) << endl;
    cout << "Find: " << text.find("World") << endl;

    // Replace
    string modified = text;
    modified.replace(7, 5, "C++");
    cout << "Replace: " << modified << endl;

    // Convert case
    string upper = text;
    transform(upper.begin(), upper.end(), upper.begin(), ::toupper);
    cout << "Upper: " << upper << endl;

    // Reverse
    string rev = text;
    reverse(rev.begin(), rev.end());
    cout << "Reverse: " << rev << endl;
    return 0;
}
`,
    },
    {
        id: 'cpp-file', title: 'File I/O', description: 'Read and write with fstream',
        language: 'cpp', category: 'File I/O',
        code: `#include <iostream>
#include <fstream>
#include <string>
using namespace std;

int main() {
    // Write to file
    ofstream outFile("output.txt");
    if (outFile.is_open()) {
        outFile << "Hello, File!" << endl;
        outFile << "Line 2" << endl;
        outFile.close();
    }

    // Read from file
    ifstream inFile("output.txt");
    string line;
    if (inFile.is_open()) {
        while (getline(inFile, line)) {
            cout << line << endl;
        }
        inFile.close();
    }
    return 0;
}
`,
    },
    {
        id: 'cpp-sort', title: 'STL Sort', description: 'Sort with std::sort and custom comparator',
        language: 'cpp', category: 'Sorting',
        code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> nums = {64, 34, 25, 12, 22, 11, 90};

    // Sort ascending
    sort(nums.begin(), nums.end());
    cout << "Ascending: ";
    for (int n : nums) cout << n << " ";
    cout << endl;

    // Sort descending
    sort(nums.begin(), nums.end(), greater<int>());
    cout << "Descending: ";
    for (int n : nums) cout << n << " ";
    cout << endl;

    // Sort strings by length
    vector<string> words = {"banana", "apple", "cherry", "date"};
    sort(words.begin(), words.end(), [](const string& a, const string& b) {
        return a.length() < b.length();
    });
    cout << "By length: ";
    for (const auto& w : words) cout << w << " ";
    cout << endl;
    return 0;
}
`,
    },
    {
        id: 'cpp-map', title: 'Map', description: 'Key-value pairs with std::map',
        language: 'cpp', category: 'Data Structures',
        code: `#include <iostream>
#include <map>
#include <string>
using namespace std;

int main() {
    map<string, int> scores;

    scores["Alice"] = 95;
    scores["Bob"] = 87;
    scores["Charlie"] = 92;

    // Access
    cout << "Alice: " << scores["Alice"] << endl;

    // Check existence
    if (scores.count("Bob") > 0) {
        cout << "Bob found!" << endl;
    }

    // Iterate
    for (const auto& [name, score] : scores) {
        cout << name << ": " << score << endl;
    }

    cout << "Total students: " << scores.size() << endl;
    return 0;
}
`,
    },
];

// ─── Java Snippets ───────────────────────────────────────────
const javaSnippets: CodeSnippet[] = [
    {
        id: 'java-hello', title: 'Hello World', description: 'Basic Java program',
        language: 'java', category: 'Hello World',
        code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
    },
    {
        id: 'java-input', title: 'Scanner Input', description: 'Read input with Scanner',
        language: 'java', category: 'Input / Output',
        code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("Enter your name: ");
        String name = scanner.nextLine();

        System.out.print("Enter your age: ");
        int age = scanner.nextInt();

        System.out.println("Hello " + name + ", you are " + age + " years old!");
        scanner.close();
    }
}
`,
    },
    {
        id: 'java-if', title: 'If-Else', description: 'Conditional branching',
        language: 'java', category: 'Conditionals',
        code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter a number: ");
        int number = scanner.nextInt();

        if (number > 0) {
            System.out.println("Positive");
        } else if (number < 0) {
            System.out.println("Negative");
        } else {
            System.out.println("Zero");
        }
        scanner.close();
    }
}
`,
    },
    {
        id: 'java-for', title: 'For Loop', description: 'Loop with counter and enhanced for',
        language: 'java', category: 'Loops',
        code: `public class Main {
    public static void main(String[] args) {
        // Classic for loop
        for (int i = 1; i <= 10; i++) {
            System.out.print(i + " ");
        }
        System.out.println();

        // Enhanced for (for-each)
        String[] fruits = {"apple", "banana", "cherry"};
        for (String fruit : fruits) {
            System.out.println(fruit);
        }
    }
}
`,
    },
    {
        id: 'java-method', title: 'Methods', description: 'Define and call methods',
        language: 'java', category: 'Functions',
        code: `public class Main {
    // Method with return value
    static int add(int a, int b) {
        return a + b;
    }

    // Method with no return
    static void greet(String name) {
        System.out.println("Hello, " + name + "!");
    }

    // Overloaded method
    static double add(double a, double b) {
        return a + b;
    }

    public static void main(String[] args) {
        greet("Alice");
        System.out.println("3 + 5 = " + add(3, 5));
        System.out.println("2.5 + 3.7 = " + add(2.5, 3.7));
    }
}
`,
    },
    {
        id: 'java-array', title: 'Arrays', description: 'Array operations',
        language: 'java', category: 'Arrays & Lists',
        code: `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] numbers = {5, 3, 8, 1, 9, 2, 7};

        System.out.println("Length: " + numbers.length);
        System.out.println("Original: " + Arrays.toString(numbers));

        Arrays.sort(numbers);
        System.out.println("Sorted: " + Arrays.toString(numbers));

        // Search (array must be sorted)
        int index = Arrays.binarySearch(numbers, 8);
        System.out.println("8 found at index: " + index);

        // 2D Array
        int[][] matrix = {
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };
        for (int[] row : matrix) {
            System.out.println(Arrays.toString(row));
        }
    }
}
`,
    },
    {
        id: 'java-arraylist', title: 'ArrayList', description: 'Dynamic list with ArrayList',
        language: 'java', category: 'Arrays & Lists',
        code: `import java.util.ArrayList;
import java.util.Collections;

public class Main {
    public static void main(String[] args) {
        ArrayList<String> names = new ArrayList<>();

        names.add("Alice");
        names.add("Bob");
        names.add("Charlie");
        names.add(1, "Dave");  // Insert at index

        System.out.println("Size: " + names.size());
        System.out.println("Get(0): " + names.get(0));

        names.remove("Bob");
        System.out.println("After remove: " + names);

        Collections.sort(names);
        System.out.println("Sorted: " + names);

        // Check contains
        System.out.println("Has Alice? " + names.contains("Alice"));
    }
}
`,
    },
    {
        id: 'java-class', title: 'Class', description: 'OOP with class, constructor, methods',
        language: 'java', category: 'Classes & Structs',
        code: `import java.util.ArrayList;

public class Main {
    // Student class
    static class Student {
        private String name;
        private int age;
        private ArrayList<Integer> grades;

        public Student(String name, int age) {
            this.name = name;
            this.age = age;
            this.grades = new ArrayList<>();
        }

        public void addGrade(int grade) {
            grades.add(grade);
        }

        public double average() {
            if (grades.isEmpty()) return 0;
            int sum = 0;
            for (int g : grades) sum += g;
            return (double) sum / grades.size();
        }

        @Override
        public String toString() {
            return name + " (age " + age + "), avg: " + String.format("%.1f", average());
        }
    }

    public static void main(String[] args) {
        Student s = new Student("Alice", 20);
        s.addGrade(85);
        s.addGrade(92);
        s.addGrade(78);
        System.out.println(s);
    }
}
`,
    },
    {
        id: 'java-string', title: 'String Methods', description: 'Common string operations',
        language: 'java', category: 'Strings',
        code: `public class Main {
    public static void main(String[] args) {
        String text = "Hello, World!";

        System.out.println("Length: " + text.length());
        System.out.println("Upper: " + text.toUpperCase());
        System.out.println("Lower: " + text.toLowerCase());
        System.out.println("Substr: " + text.substring(0, 5));
        System.out.println("Replace: " + text.replace("World", "Java"));
        System.out.println("Contains: " + text.contains("World"));
        System.out.println("Index of: " + text.indexOf("World"));
        System.out.println("Trim: " + "  spaces  ".trim());

        // Split
        String csv = "apple,banana,cherry";
        String[] parts = csv.split(",");
        for (String part : parts) {
            System.out.println(part);
        }

        // StringBuilder for efficient concatenation
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 5; i++) {
            sb.append(i).append(" ");
        }
        System.out.println("Built: " + sb.toString());
    }
}
`,
    },
    {
        id: 'java-file', title: 'File I/O', description: 'Read and write files',
        language: 'java', category: 'File I/O',
        code: `import java.io.*;

public class Main {
    public static void main(String[] args) {
        // Write to file
        try (PrintWriter writer = new PrintWriter("output.txt")) {
            writer.println("Hello, File!");
            writer.println("Line 2");
        } catch (FileNotFoundException e) {
            System.out.println("Error: " + e.getMessage());
        }

        // Read from file
        try (BufferedReader reader = new BufferedReader(new FileReader("output.txt"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        } catch (IOException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}
`,
    },
    {
        id: 'java-try', title: 'Try-Catch', description: 'Exception handling',
        language: 'java', category: 'Error Handling',
        code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        try {
            System.out.print("Enter a number: ");
            int number = Integer.parseInt(scanner.nextLine());
            int result = 10 / number;
            System.out.println("Result: " + result);
        } catch (NumberFormatException e) {
            System.out.println("That's not a valid number!");
        } catch (ArithmeticException e) {
            System.out.println("Cannot divide by zero!");
        } catch (Exception e) {
            System.out.println("An error occurred: " + e.getMessage());
        } finally {
            System.out.println("Done!");
            scanner.close();
        }
    }
}
`,
    },
    {
        id: 'java-sort', title: 'Sorting', description: 'Sort arrays and lists',
        language: 'java', category: 'Sorting',
        code: `import java.util.Arrays;
import java.util.ArrayList;
import java.util.Collections;

public class Main {
    // Bubble sort implementation
    static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }

    public static void main(String[] args) {
        // Using Arrays.sort()
        int[] numbers = {64, 34, 25, 12, 22, 11, 90};
        Arrays.sort(numbers);
        System.out.println("Sorted: " + Arrays.toString(numbers));

        // Using bubble sort
        int[] data = {64, 34, 25, 12, 22, 11, 90};
        bubbleSort(data);
        System.out.println("Bubble: " + Arrays.toString(data));

        // Sort ArrayList
        ArrayList<String> names = new ArrayList<>(Arrays.asList("Charlie", "Alice", "Bob"));
        Collections.sort(names);
        System.out.println("Names: " + names);
    }
}
`,
    },
];

// ─── JavaScript Snippets ─────────────────────────────────────
const jsSnippets: CodeSnippet[] = [
    {
        id: 'js-hello', title: 'Hello World', description: 'Console output',
        language: 'javascript', category: 'Hello World',
        code: `console.log("Hello, World!");\n`,
    },
    {
        id: 'js-input', title: 'readline Input', description: 'Read input in Node.js',
        language: 'javascript', category: 'Input / Output',
        code: `const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter your name: ', (name) => {
    rl.question('Enter your age: ', (age) => {
        console.log(\`Hello \${name}, you are \${age} years old!\`);
        rl.close();
    });
});
`,
    },
    {
        id: 'js-for', title: 'Loops', description: 'For, while, and for...of loops',
        language: 'javascript', category: 'Loops',
        code: `// Classic for loop
for (let i = 1; i <= 5; i++) {
    console.log(\`Number: \${i}\`);
}

// for...of loop
const fruits = ["apple", "banana", "cherry"];
for (const fruit of fruits) {
    console.log(fruit);
}

// forEach
fruits.forEach((fruit, index) => {
    console.log(\`\${index}: \${fruit}\`);
});
`,
    },
    {
        id: 'js-func', title: 'Functions', description: 'Regular and arrow functions',
        language: 'javascript', category: 'Functions',
        code: `// Regular function
function greet(name) {
    return \`Hello, \${name}!\`;
}

// Arrow function
const add = (a, b) => a + b;

// Function with default parameter
const multiply = (a, b = 1) => a * b;

console.log(greet("Alice"));
console.log(\`3 + 5 = \${add(3, 5)}\`);
console.log(\`4 * 3 = \${multiply(4, 3)}\`);
console.log(\`4 * default = \${multiply(4)}\`);
`,
    },
    {
        id: 'js-array', title: 'Array Methods', description: 'map, filter, reduce and more',
        language: 'javascript', category: 'Arrays & Lists',
        code: `const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// map: transform each element
const doubled = numbers.map(n => n * 2);
console.log("Doubled:", doubled);

// filter: keep elements matching condition
const evens = numbers.filter(n => n % 2 === 0);
console.log("Evens:", evens);

// reduce: accumulate to single value
const sum = numbers.reduce((acc, n) => acc + n, 0);
console.log("Sum:", sum);

// find: first match
const found = numbers.find(n => n > 5);
console.log("First > 5:", found);

// some / every
console.log("Has even?", numbers.some(n => n % 2 === 0));
console.log("All positive?", numbers.every(n => n > 0));

// sort (mutates!)
const shuffled = [5, 3, 8, 1, 9];
shuffled.sort((a, b) => a - b);
console.log("Sorted:", shuffled);
`,
    },
    {
        id: 'js-object', title: 'Objects', description: 'Object creation and methods',
        language: 'javascript', category: 'Data Structures',
        code: `const student = {
    name: "Alice",
    age: 20,
    grades: [85, 92, 78],
    
    average() {
        const sum = this.grades.reduce((a, b) => a + b, 0);
        return sum / this.grades.length;
    }
};

console.log(student.name);
console.log(\`Average: \${student.average().toFixed(1)}\`);

// Destructuring
const { name, age } = student;
console.log(\`\${name} is \${age}\`);

// Object.keys / values / entries
console.log("Keys:", Object.keys(student));
console.log("Values:", Object.values(student));
`,
    },
    {
        id: 'js-class', title: 'Classes', description: 'ES6 class with constructor',
        language: 'javascript', category: 'Classes & Structs',
        code: `class Student {
    constructor(name, age) {
        this.name = name;
        this.age = age;
        this.grades = [];
    }

    addGrade(grade) {
        this.grades.push(grade);
    }

    get average() {
        if (this.grades.length === 0) return 0;
        const sum = this.grades.reduce((a, b) => a + b, 0);
        return sum / this.grades.length;
    }

    toString() {
        return \`\${this.name} (age \${this.age}), avg: \${this.average.toFixed(1)}\`;
    }
}

const s = new Student("Alice", 20);
s.addGrade(85);
s.addGrade(92);
s.addGrade(78);
console.log(s.toString());
`,
    },
];

// ─── All Snippets ────────────────────────────────────────────
export const allSnippets: CodeSnippet[] = [
    ...pythonSnippets,
    ...cSnippets,
    ...cppSnippets,
    ...javaSnippets,
    ...jsSnippets,
];

/**
 * Get snippets filtered by language
 */
export function getSnippetsByLanguage(language: string): CodeSnippet[] {
    return allSnippets.filter(s => s.language === language);
}

/**
 * Get all unique languages that have snippets
 */
export function getSnippetLanguages(): string[] {
    return [...new Set(allSnippets.map(s => s.language))];
}

/**
 * Get snippets grouped by category for a given language
 */
export function getSnippetsGrouped(language: string): Record<string, CodeSnippet[]> {
    const filtered = getSnippetsByLanguage(language);
    const grouped: Record<string, CodeSnippet[]> = {};
    for (const snippet of filtered) {
        if (!grouped[snippet.category]) grouped[snippet.category] = [];
        grouped[snippet.category].push(snippet);
    }
    return grouped;
}

/**
 * Search snippets by query string
 */
export function searchSnippets(query: string, language?: string): CodeSnippet[] {
    const q = query.toLowerCase();
    let pool = language ? getSnippetsByLanguage(language) : allSnippets;
    return pool.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
    );
}
