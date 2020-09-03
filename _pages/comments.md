---
layout: default
title: "Comments"
permalink: /comments/
comment: false
---

<div class="comments-header">
    <h1>Comments</h1>
</div>
<div class="user-comments"></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/axios/0.19.0/axios.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/1.1.1/marked.min.js" integrity="sha512-KCyhJjC9VsBYne93226gCA0Lb+VlrngllQqeCmX+HxBBHTC4HX2FYgEc6jT0oXYrLgvfglK49ktTTc0KVC1+gQ==" crossorigin="anonymous"></script>
<script type="module">
    import { APIKEY } from './../assets/js/javable-api-key/authorization.js';
    import { commentsTemplate } from './../assets/js/utils/templates.js';
    
    const getPostUrl = (issueUrl) => {
        return axios.get(issueUrl, {
            headers: {
               Authorization: `token ${APIKEY}`
            },
        });
    };
    
    const setPostLink = async reverseData => {
        for(const data of reverseData) {
            const response = await getPostUrl(data.issue_url)
            .then(response => response.data.title);
            const postUrl = `https://woowacourse.github.io/${response}`;
            document.querySelector(".user-comments").insertAdjacentHTML('beforeend', commentsTemplate(data, postUrl));
        }
    };
    
    axios.get('https://api.github.com/repos/woowacourse/javable-comments/issues/comments', {
        headers: {
            Authorization: `token ${APIKEY}`
        },
    }).then(res => {
        const reverseData = res.data.reverse();
        setPostLink(reverseData);
    });
</script>
