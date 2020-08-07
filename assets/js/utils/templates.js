export const commentsTemplate = data =>

    `
        <div class="container">
            <img src="${data.user.avatar_url}" class="container__pics left"/>
            <p class="container__content">
                <span class="container__content__username">${data.user.login}</span>
                <span class="container__content__time">• il y a 2 heures</span>
            </p>
            <div class="container__content__text">
                <p id="comment-body-${data.id}"></p>
            </div>
            
        </div>
`