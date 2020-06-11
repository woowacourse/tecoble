---
layout: default
title: "Tags"
permalink: /tags/
comment: false
---

<div class="tag-header">
    <h1>Tags</h1>
</div>

<div>
    {% for tag in site.tags %}
        {% if tag.name == page.name %}
            <a class="tag selected" href="{{ site.baseurl }}/tags/{{ tag.name }}">#{{ tag.name }}</a>
        {% else %}
            <a class="tag" href="{{ site.baseurl }}/tags/{{ tag.name }}">#{{ tag.name }}</a>
        {% endif %}
    {% endfor %}
</div>

<div class="catalogue">
    {% for post in site.posts %}
        {% include item.html %}
    {% endfor %}
</div>