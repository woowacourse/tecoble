export const commentsTemplate = data =>
    `
        <div class="wrapper">
            <div class="third card">
                <div class="card-content">
                    <div class="comment-card">
                        <img src="${data.user.avatar_url}" class="round-icon"/>
                        <div class="comment-wrapper">
                            <div class="username">
                                <a href="${data.user.html_url}">${data.user.login}</a> 
                            </div>
                            <p class="comment">${data.body}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;