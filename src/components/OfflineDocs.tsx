import React, { useState } from 'react';
import { BookOpen, Search, Code, Terminal, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/settings/SettingsContext';

const DOCS_DATA = [
    {
        id: 'python-basics',
        title: 'Python Basics',
        icon: Code,
        content: `
# Python Fast Reference

## 1. Variables and Data Types
x = 10          # Integer
y = 3.14        # Float
name = "Alice"  # String
is_student = True # Boolean

## 2. Lists and Dictionaries
my_list = [1, 2, 3, "apple"]
my_dict = {"name": "Bob", "age": 20}

## 3. Control Flow
if x > 5:
    print("x is large")
elif x == 5:
    print("x is exactly 5")
else:
    print("x is small")

for i in range(5):
    print(i) # Prints 0 to 4

## 4. Functions
def greet(name):
    return "Hello, " + name
        `
    },
    {
        id: 'cpp-stl',
        title: 'C++ STL',
        icon: Terminal,
        content: `
# C++ Standard Template Library

## 1. Vectors (Dynamic Arrays)
#include <vector>
std::vector<int> v = {1, 2, 3};
v.push_back(4);
int size = v.size();

## 2. Maps (Key-Value)
#include <map>
std::map<std::string, int> m;
m["Alice"] = 100;

## 3. Sorting
#include <algorithm>
std::sort(v.begin(), v.end());

## 4. Input / Output
#include <iostream>
using namespace std;
int x;
cin >> x;
cout << "Result: " << x << endl;
        `
    },
    {
        id: 'java-syntax',
        title: 'Java Core',
        icon: Server,
        content: `
# Java Quick Reference

## 1. Main Method
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}

## 2. Arrays
int[] numbers = new int[5];
int[] predefined = {1, 2, 3, 4};

## 3. ArrayList
import java.util.ArrayList;
ArrayList<String> list = new ArrayList<>();
list.add("Apple");
list.get(0);

## 4. Object Oriented (Classes)
class Dog {
    String name;
    
    public Dog(String name) {
        this.name = name;
    }
    
    public void bark() {
        System.out.println("Woof!");
    }
}
        `
    }
];

export function OfflineDocs() {
    const { settings } = useSettings();
    const isDarkTheme = settings.appearance.theme === 'dark';
    
    const [query, setQuery] = useState('');
    const [selectedDoc, setSelectedDoc] = useState(DOCS_DATA[0]);

    const filteredDocs = DOCS_DATA.filter(doc => 
        doc.title.toLowerCase().includes(query.toLowerCase()) || 
        doc.content.toLowerCase().includes(query.toLowerCase())
    );

    const inputBg = isDarkTheme ? 'bg-[#0F172A]' : 'bg-slate-50';
    const inputBorder = isDarkTheme ? 'border-[#1E293B]' : 'border-slate-200';
    const textColor = isDarkTheme ? 'text-[#E5E7EB]' : 'text-slate-800';
    const mutedColor = isDarkTheme ? 'text-[#9CA3AF]' : 'text-slate-500';

    return (
        <div className={cn("flex flex-col h-full w-full p-4 overflow-y-auto", textColor)}>
            <div className="flex items-center gap-2 mb-4 shrink-0">
                <BookOpen className="w-5 h-5 text-sky-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400">Offline Docs</h2>
            </div>

            <div className="relative mb-4 shrink-0">
                <Search className={cn("w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2", mutedColor)} />
                <input 
                    type="text" 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search logic..." 
                    className={cn(
                        "w-full text-xs py-2 pl-9 pr-3 rounded-lg border focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all",
                        inputBg, inputBorder, textColor
                    )}
                />
            </div>

            <div className="flex flex-col gap-1 mb-4 shrink-0">
                {filteredDocs.map(doc => (
                    <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors border",
                            selectedDoc.id === doc.id 
                                ? "bg-sky-500/10 border-sky-500/30 text-sky-400" 
                                : cn("transparent border-transparent hover:", inputBg)
                        )}
                    >
                        <doc.icon className="w-3.5 h-3.5" />
                        {doc.title}
                    </button>
                ))}
            </div>

            {selectedDoc && (
                <div className={cn("flex-1 overflow-y-auto text-[11px] font-mono leading-relaxed p-4 rounded-xl border whitespace-pre-wrap", inputBg, inputBorder)}>
                    {selectedDoc.content}
                </div>
            )}
            
            {filteredDocs.length === 0 && (
                <div className={cn("text-xs text-center mt-10", mutedColor)}>
                    No matches found in the documentation.
                </div>
            )}
        </div>
    );
}
