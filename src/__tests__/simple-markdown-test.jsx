var assert = require("assert");
var _ = require("underscore");

var SimpleMarkdown = require("../simple-markdown.jsx");
var {
    defaultParse,
    defaultOutput
} = SimpleMarkdown;

var validateParse = (parsed, expected) => {
    if (!_.isEqual(parsed, expected)) {
        var parsedStr = JSON.stringify(parsed, null, 4);
        var expectedStr = JSON.stringify(expected, null, 4);
        console.error("Parsed:", parsedStr);
        console.error("Expected:", expectedStr);
        assert.fail(
            parsedStr,
            expectedStr,
            "parsed did not match expected",
            "<>"
        );
    }
};

describe("simple markdown", () => {
    describe("parser", () => {
        it("should parse a plain string", () => {
            var parsed = defaultParse("hi there");
            validateParse(parsed, [{
                type: "text",
                content: "hi there"
            }]);
        });

        it("should parse bold", () => {
            var parsed = defaultParse("**hi**");
            validateParse(parsed, [{
                type: "strong",
                content: [{
                    type: "text",
                    content: "hi"
                }]
            }]);
        });

        it("should parse italics", () => {
            var parsed = defaultParse("*hi*");
            validateParse(parsed, [{
                type: "em",
                content: [{
                    type: "text",
                    content: "hi"
                }]
            }]);
        });

        it("should parse strikethrough", () => {
            var parsed = defaultParse("~~hi~~");
            validateParse(parsed, [{
                type: "del",
                content: [{
                    type: "text",
                    content: "hi"
                }]
            }]);

            // not super important that it parses this like this, but
            // it should be a valid something...
            var parsed2 = defaultParse("~~~~~");
            validateParse(parsed2, [{
                type: "del",
                content: [{
                    type: "text",
                    content: "~"
                }]
            }]);
        });

        it("should parse underlines", () => {
            var parsed = defaultParse("__hi__");
            validateParse(parsed, [{
                type: "u",
                content: [{
                    type: "text",
                    content: "hi"
                }]
            }]);
        });

        it("should parse nested bold/italics", () => {
            var parsed = defaultParse("***hi***");
            validateParse(parsed, [{
                type: "strong",
                content: [{
                    type: "em",
                    content: [{
                        type: "text",
                        content: "hi"
                    }]
                }]
            }]);
        });

        it("should parse nested bold/italics/underline", () => {
            var parsed1 = defaultParse("***__hi__***");
            validateParse(parsed1, [{
                type: "strong",
                content: [{
                    type: "em",
                    content: [{
                        type: "u",
                        content: [{
                            type: "text",
                            content: "hi"
                        }]
                    }]
                }]
            }]);

            var parsed2 = defaultParse("*__**hi**__*");
            validateParse(parsed2, [{
                type: "em",
                content: [{
                    type: "u",
                    content: [{
                        type: "strong",
                        content: [{
                            type: "text",
                            content: "hi"
                        }]
                    }]
                }]
            }]);
        });

        it("should parse multiple bold/italics/underlines", () => {
            var parsed = defaultParse(
                "*some* of this __sentence__ is **bold**"
            );
            validateParse(parsed, [
                {
                    type: "em",
                    content: [{
                        type: "text",
                        content: "some"
                    }]
                },
                {
                    type: "text",
                    content: " of this "
                },
                {
                    type: "u",
                    content: [{
                        type: "text",
                        content: "sentence"
                    }]
                },
                {
                    type: "text",
                    content: " is "
                },
                {
                    type: "strong",
                    content: [{
                        type: "text",
                        content: "bold"
                    }]
                }
            ]);
        });
        
        it("should parse inline code", () => {
            var parsed = defaultParse("`hi`");
            validateParse(parsed, [{
                type: "inlineCode",
                content: "hi"
            }]);
        });

        it("should parse * and _ inside `` as code", () => {
            var parsed = defaultParse(
                "`const int * const * const p; // _hi_`"
            );
            validateParse(parsed, [{
                type: "inlineCode",
                content: "const int * const * const p; // _hi_"
            }]);
        });

        it("should allow you to escape special characters with \\", () => {
            var parsed = defaultParse(
                "\\`hi\\` \\*bye\\*"
            );
            validateParse(parsed, [
                {
                    type: "text",
                    content: "`"
                },
                {
                    type: "text",
                    content: "hi"
                },
                {
                    type: "text",
                    content: "`"
                },
                {
                    type: "text",
                    content: " "
                },
                {
                    type: "text",
                    content: "*"
                },
                {
                    type: "text",
                    content: "bye"
                },
                {
                    type: "text",
                    content: "*"
                },
            ]);
        });

        it("should parse basic []() links as links", () => {
            var parsed = defaultParse("[hi](http://www.google.com)");
            validateParse(parsed, [{
                type: "link",
                content: [{
                    type: "text",
                    content: "hi"
                }],
                target: "http://www.google.com"
            }]);

            var parsed2 = defaultParse("[secure](https://www.google.com)");
            validateParse(parsed2, [{
                type: "link",
                content: [{
                    type: "text",
                    content: "secure"
                }],
                target: "https://www.google.com"
            }]);

            var parsed3 = defaultParse(
                "[local](http://localhost:9000/test.html)"
            );
            validateParse(parsed3, [{
                type: "link",
                content: [{
                    type: "text",
                    content: "local"
                }],
                target: "http://localhost:9000/test.html"
            }]);

            var parsed4 = defaultParse(
                "[params](http://localhost:9000/test.html" +
                "?content=%7B%7D&format=pretty)"
            );
            validateParse(parsed4, [{
                type: "link",
                content: [{
                    type: "text",
                    content: "params"
                }],
                target: "http://localhost:9000/test.html" +
                        "?content=%7B%7D&format=pretty"
            }]);

            var parsed5 = defaultParse(
                "[hash](http://localhost:9000/test.html#content=%7B%7D)"
            );
            validateParse(parsed5, [{
                type: "link",
                content: [{
                    type: "text",
                    content: "hash"
                }],
                target: "http://localhost:9000/test.html#content=%7B%7D"
            }]);
        });

        it("shouldn't parse \\[s as links", () => {
            var parsed = defaultParse("\\[hi](http://www.google.com)");
            validateParse(parsed, [
                {type: "text", content: "["},
                {type: "text", content: "hi](http://www.google.com)"},
            ]);
        });

        it("should parse a single top-level paragraph", () => {
            var parsed = defaultParse("hi\n\n");
            validateParse(parsed, [{
                type: "paragraph",
                content: [{
                    type: "text",
                    content: "hi"
                }]
            }]);
        });

        it("should parse multiple top-level paragraphs", () => {
            var parsed = defaultParse("hi\n\nbye\n\nthere\n\n");
            validateParse(parsed, [
                {
                    type: "paragraph",
                    content: [{
                        type: "text",
                        content: "hi"
                    }]
                },
                {
                    type: "paragraph",
                    content: [{
                        type: "text",
                        content: "bye"
                    }]
                },
                {
                    type: "paragraph",
                    content: [{
                        type: "text",
                        content: "there"
                    }]
                },
            ]);
        });

        it("should not parse single newlines as paragraphs", () => {
            var parsed = defaultParse("hi\nbye\nthere\n");
            validateParse(parsed, [{
                type: "text",
                content: "hi\nbye\nthere\n"
            }]);
        });

        it("should not parse a single newline as a new paragraph", () => {
            var parsed = defaultParse("hi\nbye\nthere\n\n");
            validateParse(parsed, [{
                type: "paragraph",
                content: [{
                    type: "text",
                    content: "hi\nbye\nthere"
                }]
            }]);
        });

        it("should parse a single heading", () => {
            var parsed = defaultParse("### heading3\n\n");
            validateParse(parsed, [{
                type: "heading",
                level: 3,
                content: [{
                    type: "text",
                    content: "heading3"
                }]
            }]);
        });

        it("should parse a single lheading", () => {
            var parsed = defaultParse("heading2\n-----\n\n");
            validateParse(parsed, [{
                type: "heading",
                level: 2,
                content: [{
                    type: "text",
                    content: "heading2"
                }]
            }]);
        });

        it("should not parse a single lheading with two -- or ==", () => {
            var parsed = defaultParse("heading1\n==\n\n");
            validateParse(parsed, [{
                type: "paragraph",
                content: [{
                    type: "text",
                    content: "heading1\n==",
                }]
            }]);

            var parsed2 = defaultParse("heading2\n--\n\n");
            validateParse(parsed2, [{
                type: "paragraph",
                content: [{
                    type: "text",
                    content: "heading2\n--",
                }]
            }]);
        });

        it("7 #s should not parse as an h7", () => {
            var parsed = defaultParse("#######heading7\n\n");
            validateParse(parsed, [{
                type: "heading",
                level: 6,
                content: [{
                    type: "text",
                    content: "#heading7"
                }]
            }]);
        });

        it("should parse a heading between paragraphs", () => {
            var parsed = defaultParse(
                "para 1\n\n" +
                "#heading\n\n\n" +
                "para 2\n\n"
            );
            validateParse(parsed, [
                {
                    type: "paragraph",
                    content: [{
                        type: "text",
                        content: "para 1"
                    }]
                },
                {
                    type: "heading",
                    level: 1,
                    content: [{
                        type: "text",
                        content: "heading"
                    }]
                },
                {
                    type: "paragraph",
                    content: [{
                        type: "text",
                        content: "para 2"
                    }]
                },
            ]);
        });

        it("should parse a single top-level blockquote", () => {
            var parsed = defaultParse("> blockquote\n\n");
            validateParse(parsed, [{
                type: "blockQuote",
                content: [{
                    type: "paragraph",
                    content: [{
                        type: "text",
                        content: "blockquote"
                    }],
                }]
            }]);
        });

        it("should parse multiple blockquotes and paragraphs", () => {
            var parsed = defaultParse(
                "para 1\n\n" +
                "> blockquote 1\n" +
                ">\n" +
                ">blockquote 2\n\n" +
                "para 2\n\n"
            );
            validateParse(parsed, [
                {
                    type: "paragraph",
                    content: [{
                        type: "text",
                        content: "para 1"
                    }],
                },
                {
                    type: "blockQuote",
                    content: [
                        {
                            type: "paragraph",
                            content: [{
                                type: "text",
                                content: "blockquote 1"
                            }],
                        },
                        {
                            type: "paragraph",
                            content: [{
                                type: "text",
                                content: "blockquote 2"
                            }],
                        }
                    ]
                },
                {
                    type: "paragraph",
                    content: [{
                        type: "text",
                        content: "para 2"
                    }],
                },
            ]);
        });

        it("should parse a single top-level code block", () => {
            var parsed = defaultParse("    if (true) { code(); }\n\n");
            validateParse(parsed, [{
                type: "codeBlock",
                content: "if (true) { code(); }"
            }]);
        });

        it("should parse mixed paragraphs and code", () => {
            var parsed = defaultParse(
                "this is regular text\n\n" +
                "    this is code\n\n" +
                "this is more regular text\n\n");
            validateParse(parsed, [
                {
                    type: "paragraph",
                    content: [{
                        type: "text",
                        content: "this is regular text"
                    }]
                },
                {
                    type: "codeBlock",
                    content: "this is code"
                },
                {
                    type: "paragraph",
                    content: [{
                        type: "text",
                        content: "this is more regular text"
                    }]
                },
            ]);
        });

        it("should parse top-level horizontal rules", () => {
            var parsed = defaultParse(
                "---\n" +
                "***\n" +
                "___\n\n" +
                " - - - - \n\n" +
                "_ _ _\n\n" +
                "  ***  \n\n"
            );
            validateParse(parsed, [
                { type: "hr" },
                { type: "hr" },
                { type: "hr" },
                { type: "hr" },
                { type: "hr" },
                { type: "hr" },
            ]);
        });

        it("should parse hrs between paragraphs", () => {
            var parsed = defaultParse(
                "para 1\n\n" +
                " * * * \n\n" +
                "para 2\n\n");
            validateParse(parsed, [
                {
                    type: "paragraph",
                    content: [{
                        type: "text",
                        content: "para 1"
                    }]
                },
                { type: "hr" },
                {
                    type: "paragraph",
                    content: [{
                        type: "text",
                        content: "para 2"
                    }]
                },
            ]);
        });

        it("should parse simple unordered lists", () => {
            var parsed = defaultParse(
                " * hi\n" +
                " * bye\n" +
                " * there\n\n"
            );
            validateParse(parsed, [{
                type: "list",
                ordered: false,
                items: [
                    [{
                        type: "text",
                        content: "hi\n",
                    }],
                    [{
                        type: "text",
                        content: "bye\n",
                    }],
                    [{
                        type: "text",
                        content: "there",
                    }],
                ]
            }]);
        });

        it("should parse simple ordered lists", () => {
            var parsed = defaultParse(
                "1. first\n" +
                "2. second\n" +
                "3. third\n\n"
            );
            validateParse(parsed, [{
                type: "list",
                ordered: true,
                items: [
                    [{
                        type: "text",
                        content: "first\n",
                    }],
                    [{
                        type: "text",
                        content: "second\n",
                    }],
                    [{
                        type: "text",
                        content: "third",
                    }],
                ]
            }]);
        });

        it("should parse simple ordered lists with silly numbers", () => {
            var parsed = defaultParse(
                "1. first\n" +
                "13. second\n" +
                "9. third\n\n"
            );
            validateParse(parsed, [{
                type: "list",
                ordered: true,
                items: [
                    [{
                        type: "text",
                        content: "first\n",
                    }],
                    [{
                        type: "text",
                        content: "second\n",
                    }],
                    [{
                        type: "text",
                        content: "third",
                    }],
                ]
            }]);
        });

        it("should parse nested lists", () => {
            var parsed = defaultParse(
                "1. first\n" +
                "2. second\n" +
                "   * inner\n" +
                "   * inner\n" +
                "3. third\n\n"
            );
            validateParse(parsed, [{
                type: "list",
                ordered: true,
                items: [
                    [{
                        type: "text",
                        content: "first\n",
                    }],
                    [
                        {
                            type: "text",
                            content: "second\n",
                        },
                        {
                            type: "list",
                            ordered: false,
                            items: [
                                [{
                                    type: "text",
                                    content: "inner\n"
                                }],
                                [{
                                    type: "text",
                                    content: "inner"
                                }]
                            ]
                        }
                    ],
                    [{
                        type: "text",
                        content: "third",
                    }],
                ]
            }]);
        });

        it("should parse loose lists", () => {
            var parsed = defaultParse(
                " * hi\n\n" +
                " * bye\n\n" +
                " * there\n\n"
            );
            validateParse(parsed, [{
                type: "list",
                ordered: false,
                items: [
                    [{
                        type: "paragraph",
                        content: [{
                            type: "text",
                            content: "hi"
                        }]
                    }],
                    [{
                        type: "paragraph",
                        content: [{
                            type: "text",
                            content: "bye"
                        }]
                    }],
                    [{
                        type: "paragraph",
                        content: [{
                            type: "text",
                            content: "there"
                        }]
                    }],
                ]
            }]);
        });

        it("should parse paragraphs within loose lists", () => {
            var parsed = defaultParse(
                " * hi\n\n" +
                "   hello\n\n" +
                " * bye\n\n" +
                " * there\n\n"
            );
            validateParse(parsed, [{
                type: "list",
                ordered: false,
                items: [
                    [
                        {
                            type: "paragraph",
                            content: [{
                                type: "text",
                                content: "hi"
                            }]
                        },
                        {
                            type: "paragraph",
                            content: [{
                                type: "text",
                                content: "hello"
                            }]
                        },
                    ],
                    [{
                        type: "paragraph",
                        content: [{
                            type: "text",
                            content: "bye"
                        }]
                    }],
                    [{
                        type: "paragraph",
                        content: [{
                            type: "text",
                            content: "there"
                        }]
                    }],
                ]
            }]);
        });

        it("should allow line breaks+wrapping in tight lists", () => {
            var parsed = defaultParse(
                " * hi\n" +
                "   hello\n\n" +
                " * bye\n\n" +
                " * there\n\n"
            );
            validateParse(parsed, [{
                type: "list",
                ordered: false,
                items: [
                    [{
                        type: "paragraph",
                        content: [{
                            type: "text",
                            content: "hi\nhello"
                        }]
                    }],
                    [{
                        type: "paragraph",
                        content: [{
                            type: "text",
                            content: "bye"
                        }]
                    }],
                    [{
                        type: "paragraph",
                        content: [{
                            type: "text",
                            content: "there"
                        }]
                    }],
                ]
            }]);
        });
    });
});
