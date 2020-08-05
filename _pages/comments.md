---
layout: default
title: "Comments"
permalink: /comments/
comment: false
---

<div class="tag-header">
    <h1>Comments</h1>
    <div class="user-comments"></div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/axios/0.19.0/axios.min.js"></script>
<script type="module">
    import { APIKEY } from './../assets/js/javable-api-key/authorization.js'
    import { commentsTemplate } from './../assets/js/utils/templates.js'

    axios.get('https://api.github.com/repos/woowacourse/javable-comments/issues/comments', {
        headers: {
            Authorization: APIKEY
        }
    }).then(res => {
        const reverseData = res.data.reverse()
        reverseData.forEach(data => {
            console.log(data)
            document.querySelector(".user-comments").insertAdjacentHTML('beforeend', commentsTemplate(data))
        })
    })
</script>