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
        const promises = reverseData.map(async data => {
            return await getPostUrl(data.issue_url)
            .then(response => {
                const postUrl = `https://woowacourse.github.io/${response.data.title}`;
                return {data, postUrl};
            });
        });
        const results = await Promise.all(promises);
        results.map(result => {
            document.querySelector(".user-comments").insertAdjacentHTML('beforeend', commentsTemplate(result.data, result.postUrl));
        });
    };
    
    axios.get('https://api.github.com/repos/woowacourse/javable-comments/issues/comments', {
        headers: {
            Authorization: `token ${APIKEY}`
        },
    }).then(async res => {
        const reverseData = res.data.reverse();
        await setPostLink(reverseData);
    });
</script>
