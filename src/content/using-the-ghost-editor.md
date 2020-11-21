---
layout: post
title: 'Using The Ghost Editor'
author: [Ghost]
tags: ['Getting Started']
image: img/writing.jpg
date: '2015-02-02T23:46:37.121Z'
draft: false
---

Ghost uses a language called **Markdown** to format text.

When you go to edit a post and see special characters and colours intertwined between the words, those are Markdown shortcuts which tell Ghost what to do with the words in your document. The biggest benefit of Markdown is that you can quickly apply formatting as you type, without needing to pause.

At the bottom of the editor, you'll find a toolbar with basic formatting options to help you get started as easily as possible. You'll also notice that there's a **?** icon, which contains more advanced shortcuts.

For now, though, let's run you through some of the basics. You'll want to make sure you're editing this post in order to see all the Markdown we've used.

## Formatting text

The most common shortcuts are of course, **bold** text, _italic_ text, and [hyperlinks](https://example.com). These generally make up the bulk of any document. You can type the characters out, but you can also use keyboard shortcuts.

- `CMD/Ctrl + B` for Bold
- `CMD/Ctrl + I` for Italic
- `CMD/Ctrl + K` for a Link
- `CMD/Ctrl + H` for a Heading (Press multiple times for h2/h3/h4/etc)

With just a couple of extra characters here and there, you're well on your way to creating a beautifully formatted story.

## Inserting images

Images in Markdown look just the same as links, except they're prefixed with an exclamation mark, like this:

`![Image description](/path/to/image.jpg)`

![Computer](img/computer.jpg)

Most Markdown editors don't make you type this out, though. In Ghost you can click on the image icon in the toolbar at the bottom of the editor, or you can just click and drag an image from your desktop directly into the editor. Both will upload the image for you and generate the appropriate Markdown.

_**Important Note:** Ghost does not currently have automatic image resizing, so it's always a good idea to make sure your images aren't gigantic files **before** uploading them to Ghost._

## Making lists

Lists in HTML are a formatting nightmare, but in Markdown they become an absolute breeze with just a couple of characters and a bit of smart automation. For numbered lists, just write out the numbers. For bullet lists, just use `*` or `-` or `+`. Like this:

1. Crack the eggs over a bowl
2. Whisk them together
3. Make an omelette

or

- Remember to buy milk
- Feed the cat
- Come up with idea for next story

## Adding quotes

When you want to pull out a particularly good excerpt in the middle of a piece, you can use `>` at the beginning of a paragraph to turn it into a Blockquote. You might've seen this formatting before in email clients.

> A well placed quote guides a reader through a story, helping them to understand the most important points being made

All themes handles blockquotes slightly differently. Sometimes they'll look better kept shorter, while other times you can quote fairly hefty amounts of text and get away with it. Generally, the safest option is to use blockquotes sparingly.

## Dividing things up

If you're writing a piece in parts and you just feel like you need to divide a couple of sections distinctly from each other, a horizontal rule might be just what you need. Dropping `---` on a new line will create a sleek divider, anywhere you want it.

---

This should get you going with the vast majority of what you need to do in the editor, but if you're still curious about more advanced tips then check out the [Advanced Markdown Guide](/advanced-markdown/) - or if you'd rather learn about how Ghost taxononomies work, we've got a overview of [how to use Ghost tags](/using-tags/).
