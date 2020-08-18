export const commentsTemplate = (data, postUrl) => {
  const content = marked(data.body);

  return `
        <div class="container" OnClick="location.href = '${postUrl}'">
                <div class="container__content">
                    <img src="${data.user.avatar_url}" class="container__pics left"/>
                    <a class="container__content__username" href="${data.user.html_url}">${data.user.login}</a>
                <span>${data.created_at.substring(0, data.created_at.lastIndexOf("T"))}</span>
                </div>
                <div class="container__content__text">
                ${content}
                </div>
        </div>
`
}
