---
layout: post
title: Life of Pixel
author: [4기_병민]
tags: ['composite', 'layer', '렌더링']
data: '2022-09-26T12:00:00.000Z'
draft: true
image: ../teaser/life-of-pixel.png
---

<br>

이 글은 Google Chrome 개발자 Steve Kobes의 [Life of Pixel영상](https://www.youtube.com/watch?v=K2QHdgAKP-s)을 보고 정리한 내용입니다. 사용된 이미지들은 Steve Kobes의 허락 하에 [slide show](https://docs.google.com/presentation/d/1boPxbgNrTU0ddsc144rcXayGA_WF53k96imRH8Mp34Y/edit#slide=id.ga884fe665f_64_6)에서 가져왔습니다.

![sc_-37](https://user-images.githubusercontent.com/52737532/192159544-25046ba1-63ae-4c06-8a95-3fd8fd1a6f07.png)

# 이 글의 목표

1. 어떤 과정을 통해 html파일이 화면에 그려지는 page가 되는지 이해합니다
2. composite에 대해 이해합니다
3. 왜 layer를 분리하는것이 더 빠른 렌더링을 가능하게 하는지 이해합니다

# 간단 요약

![sc_-36](https://user-images.githubusercontent.com/52737532/192159612-0e7e1ae1-245e-4c9d-92ae-bef108f81aa2.png)

1. html content(index.html)를 불러옵니다
2. HTML Parser가 index.html을 parsing하면서 DOM을 생성합니다 (DOM)
3. style 자원을 만나면 CSS Parser가 parsing후, 각 DOM 노드에 computedStyle을 적용합니다 (style)
4. DOM과 computedStyle을 바탕으로 각 노드의 position과 size를 계산합니다(layout)
5. layout tree를 바탕으로 layer tree를 생성합니다 (comp.assign)
6. 노드를 어떻게 그릴지에 대한 작업 순서를 정합니다(paint)
7. 작업 순서를 compositor thread (=impl) 에게 전달합니다 (commit)
8. GPU process에서 paint단계때 정한 작업 순서들을 바탕으로 bitmap을 생성합니다 (rasterization)
9. 이제 bitmap을 OpenGL을 통해 화면에 그립니다.

그림에 나오는 중간에 prepaint, tiling, SKIA는 아래쪽에서 더 설명하겠습니다.

# 화면에 그려지는 과정

## Parsing

![sc_-41](https://user-images.githubusercontent.com/52737532/192159617-6a28988b-2bc6-434c-b537-f911a3318c63.png)

HTMLParser는 html tag를 읽으면서 DOM Tree를 생성합니다.

조금 더 구체적인 parsing과정은 다음과 같습니다.

![](https://develoger.kr/wp-content/uploads/parsing.webp)

from : https://web.dev/critical-rendering-path-constructing-the-object-model/

## DOM

![sc_-43-1](https://user-images.githubusercontent.com/52737532/192159624-f6079a53-0751-4379-b76b-4ce85101b799.png)

DOM은 두가지를 의미합니다.

1. HTML Tag를 parsing해서 만든 C++로 이루어진 트리 형태의 자료 구조(내부 구현체)
2. 이 내부 구현체에 javascript로 접근해서 조작할 수 있도록 만든 API

## Style Calculation

![sc_-45-1](https://user-images.githubusercontent.com/52737532/192159629-40f8532e-39fa-4c88-8b84-c5d8e221d165.png)

CSSParser는 css코드를 파싱하면서 StyleRule을 생성하고 그것을 StyleSheetContents에 담습니다.

다시말해서,

![sc_-55](https://user-images.githubusercontent.com/52737532/192159634-642884e5-fdb7-48ca-9a66-aa775212dc8b.png)

이런 css코드를 파싱해서

![sc_-56](https://user-images.githubusercontent.com/52737532/192159643-910ba991-5d2b-4c80-891d-2497ab2c3f1e.png)

이런 StyleRule을 만들어 내는것이라 **추측**됩니다.

![sc_-57](https://user-images.githubusercontent.com/52737532/192159652-7ba1694d-7b2a-4970-97b5-fa675bec2c57.png)

StyleResolver는 StyleRule이 담겨있는 StyleSheetContents를 바탕으로 각 노드(Element)에 대한 ComputedStyle을 구해서 적용합니다.

ComputedStyle은 css selector 우선순위 까지 다 고려(cascading)해서 최종적으로 노드에 적용될 css 값들의 모음입니다. dev-tools에서 쉽게 확인 가능합니다.

![sc_-58](https://user-images.githubusercontent.com/52737532/192159666-b660e116-2937-4671-90b2-b60ae29d0fbe.png)

### 쉽게 말하자면

![sc_-59](https://user-images.githubusercontent.com/52737532/192159688-b44bf7c4-12fd-44de-a6c8-61f6e1aa504d.png)

from : https://developer.chrome.com/blog/inside-browser-part3/#subresource-loading

css코드를 파싱하고 DOM의 각 노드에 대한 ComputedStyle을 구해서 적용합니다.

## Layout

이제 DOM을 만들었고 각 노드에 대한 style도 알았으니, 위치와 사이즈 값도 알아낼 수 있습니다.

![sc_-61](https://user-images.githubusercontent.com/52737532/192159692-d7159e57-7ae2-4661-bf0e-c9872ffb483c.png)

### 너무 어려운 Layout 과정

그런데 이 과정은 꽤나 어렵습니다. 고려해야 할것이 많기 때문입니다.

![sc_-62](https://user-images.githubusercontent.com/52737532/192159696-0fb835d2-e3db-42e6-9934-a016b6846054.png)

이렇게 라인이 넘어가는 것도 고려 해줘야하고

![sc_-63](https://user-images.githubusercontent.com/52737532/192159703-a9b3992e-188e-4b52-91e2-5026ee2cb1fc.png)

font도 고려해 줘야 합니다. 이 외에도 overflow나 float속성도 고려해서 위치값을 계산해야 합니다.

제가 어디서 읽은 바로는 크롬 브라우저 개발자의 대부분이 이 layout계산쪽에서 일을 한다고 합니다. 그정도로 복잡하고 어려운 일이라고 합니다.

### Layout Tree 생성

메인 쓰레드에서 이 레이아웃을 계산 하면서 레이아웃 트리를 생성합니다. 레이아웃 트리의 LayoutObject들은 각각 DOM Tree의 노드와 연결되어 있습니다.

![sc_-64](https://user-images.githubusercontent.com/52737532/192159710-4067506f-3d0e-4fa7-936c-d57abfc0343c.png)

우리가 흔히 아는 reflow가 바로 여기서 일어납니다. 즉, reflow는 layout tree를 순회하면서 각 LayoutObject의 위치값과 사이즈를 다시 계산하는 것을 의미합니다.

예를들어서, DOM Elment의 width/height/top/right 등을 바꾸면 이 layout tree를 순회하면서 LayoutObject의 위치값과 사이즈를 다시 계산합니다.

## Paint

이제 각 노드들의 스타일과 위치값을 알았으니 화면에 그리는 일만 남았습니다. 하지만! 이름과 달리 paint단계는 화면에 그리는 일을 하는 단계가 아닙니다.

paint 단계에서는 화면에 무엇을 어떤 순서로 그려야 할지에 대한 정보를 기록하는 일이 이뤄집니다.

![sc_-65](https://user-images.githubusercontent.com/52737532/192159724-0acade83-abd2-4736-9260-75f1fc6278a4.png)

PO즉, Paint Operation은 "\[100, 200\]에 가로가 200px, 세로가 140px인 사각형을 그려!" 라는 작업 내용입니다. 이것들이 쌓여서 DisplayItem에 들어가고, 이 DisplayItem의 목록은 PaintArtifact에 들어갑니다.

DisplayItem을 조금 더 확대해 보면 이렇게 생겼습니다.

![sc_-68-1](https://user-images.githubusercontent.com/52737532/192159731-7a47a69b-43f2-43a8-9a1e-63d92a3fb279.png)

위 설명에 대한 조금 더 쉬운 그림은 다음과 같습니다.

![sc_-66](https://user-images.githubusercontent.com/52737532/192159738-4445cf16-174b-49f7-9bb2-755477dc14b6.png)

from : https://developer.chrome.com/blog/inside-browser-part3/#subresource-loading

### z-index를 고려하라

![sc_-67-1](https://user-images.githubusercontent.com/52737532/192159745-f6fb4b83-1678-49b8-8934-368b128a394f.png)

z-index도 잘 고려되서 그려질 수 있도록 PO가 구성됩니다.

## Raster

이제 어떤 순서로 그려야 할지 알았기 때문에, 화면에 그리는 일만 남았다고 생각할 수 있지만, 아직 조금 더 남았습니다.

위에서 구한 정보들(DisplayItem)을 바탕으로 bitmap을 만드는 일을 rasterization이라고 부릅니다.

![sc_-69-2](https://user-images.githubusercontent.com/52737532/192159751-f8a94efd-0235-4f96-99a3-bebe14deb18a.png)

그리고 이 rasterization은 일반적으로 GPU 안에서 이뤄집니다.

![sc_-70-2](https://user-images.githubusercontent.com/52737532/192159756-2fffa8fb-e5fc-4d16-b2ab-23c105a05459.png)

현재 사용중인 브라우저에서 GPU 가속이 사용되고 있는지 확인하려면 [chrome://gpu/](chrome://gpu/) 요기로 들어가면 됩니다.

![sc_-71-1](https://user-images.githubusercontent.com/52737532/192159765-a776cba5-7661-4276-ba26-8a7e976c56fc.png)

Rasterization에 Hardware accelerated가 되어있는걸 볼 수있습니다.

### raster to screen

이렇게 rasterization되고 나서 screen에 pixel로 그려지는 작업도 GPU에서 일어납니다.

![sc_-73-3](https://user-images.githubusercontent.com/52737532/192159769-16ab1039-8f26-4a74-a017-5ea9b8c174f7.png)

#### SKIA

다양한 하드웨어 및 소프트웨어 플랫폼에서 작동하는 공통 API를 제공하는 오픈 소스 2D 그래픽 라이브러리입니다. 구글 크롬, 크롬 OS, 안드로이드, Flutter 등 여러 제품의 그래픽 엔진 역할을 합니다. 구글에서 만들었습니다.

#### OpenGL

그래픽 카드와 통신할 수 있도록 지원해주는 API또는 표준 규격입니다. 이 API는 GPU에게 직접적으로 명령을 내리는 command로 변환됩니다.

#### Skia와 OpenGL의 관계

Skia 라이브러리에서 제공하는 API를 사용하면 OpenGL API로 변환됩니다. 즉, Skia는 조금 더 고수준의 API인것이죠.

### 쉽게 설명 하자면

Paint이후 GPU에서 rasterization이 이뤄지고 화면에 pixel로 그려집니다.

# 화면에 그린 이후 변화발생

![sc_-74-4](https://user-images.githubusercontent.com/52737532/192159778-abd58db4-af18-4a45-a2ae-32797246892f.png)

DOM -> style -> layout -> paint -> raster -> gpu -> 화면에 그리기! 까지 왔습니다. 그런데 사용자가 스크롤을 하거나, 줌인/아웃을 하거나 javascript로 style을 동적으로 바꾸면 브라우저는 이를 어떻게 처리할까요?

## Frame

![sc_-75-1](https://user-images.githubusercontent.com/52737532/192159783-3f7b1e50-b1da-4577-affc-aca296cf700c.png)

초당 60frame을 그리지 못하면, 화면이 뚝뚝 끊겨 보이는(janky) 현상이 발생합니다.

## Invalidation

렌더링이 빨리빨리 되도록 하는 여러 방법중 하나는, 변했는지 안변했는지 체크하고 변한 부분만 업데이트 하는것입니다. 예를들어서

![sc_-77-1](https://user-images.githubusercontent.com/52737532/192159791-5aeaf923-6a91-4977-add0-db92f7c03774.png)

DOM노드의 style에 변화가 가해졌으니 다음 프레임때 computedStyle을 다시 구할 필요가 있기때문에, 표시(mark)해 놓습니다(SetNeedsStyleRecalc 호출).

마찬가지로 Layout에 변화가 가해졌다면, 다음 프래임때 layout을 다시 계산하도록 표시해 놓습니다(SetNeedsLayout).

변화가 없다면 이전 프레임에서 계산된 결과(DOM Node, LayoutObject 등)를 그대로 사용합니다.

이렇게 변화가 가해졌을때 다음 프레임에 새로 계산하도록 표시하는것을 invalidation이라고 부릅니다. (slide에는 granular asynchronous invalidations 라고 적혀있습니다)

## repaint

하지만 스크롤이나 애니메이션 같은 경우에는 위의 optimization이 큰 효과를 못봅니다. 너무 많이 변하기 때문입니다. 예를들어서, 스크롤 같은 경우

![sc_-79-1](https://user-images.githubusercontent.com/52737532/192159797-74e9f573-0815-462b-9886-bc3a481c6bad.png)

매 스크롤 이벤트마다 repaint와 rasterization이 계속 발생합니다. 이는 비용이 많이 들어갑니다.

## jank

scroll으로 인한 repaint - rasterization 외에도 우리가 신경써야 할것이 있습니다. 바로 javascript도 main thread에서 실행된다는 것입니다.

![sc_-80-2](https://user-images.githubusercontent.com/52737532/192159803-a1c5c147-8952-40a7-8d3a-8fcafe487d0f.png)

(scroll로 인한 repaint - rasterization은 어쩔 수 없는건데 왜 신경 써야 하나?..라고 생각하실 수 있습니다. 이는 아래 compositor쪽에 이야기가 다시 나옵니다.)

그래서 아무리 rendering pipeline이 빠르게 진행 된다고 하더라도 javascript코드 실행이 너무 오래걸리면 jank가 발생합니다.

# Compositing

그래서 invalidation 같은 최적화 기능도 있지만, scroll로 인한 repaint + rasterization과 javascript 코드를 실행하는 비용이 많이 들어서 rendering이 늦어지는 문제를 완화하기 위해 compositing이 나왔습니다.

![sc_-82-1](https://user-images.githubusercontent.com/52737532/192159812-5b0227c9-05e3-4e4e-aeca-aeea90847762.png)

먼저 메인 쓰레드에서 page를 여러 layer로 나누고 compositor thread에서 이를 합성합니다. 이렇게 layer를 나누면 rasterizing이 각 레이어에서 독립적으로 발생합니다.

## 예시

![comisiting-layer-1](https://user-images.githubusercontent.com/52737532/192159816-91c23a2b-24f3-4197-b21b-10f3d924f933.gif)

BBB layer를 rasterizing해서 만든 **bitmap만 transform하면**, 매 animation frame마다 전체 페이지를 rasterizing 하지 않아도 됩니다.

![compositing-layer-3](https://user-images.githubusercontent.com/52737532/192159824-2717ecff-ba3f-45ad-a0c9-5222808462c9.gif)

그리고 부모가 layer라면 자식들도 그 layer의 subtree가 됩니다.

![compositing-layer-4](https://user-images.githubusercontent.com/52737532/192159828-c3a30b98-63fb-4a77-9519-c6ff9087ec78.gif)

이렇게 layer를 분리해서 rasterizing후 **생성된 bitmap만 변형**하게 된다면, 매 animation frame마다 전체 페이지를 rasterizing 하지 않아도 되기 때문에 효율적입니다.

## threaded input

![sc_-86](https://user-images.githubusercontent.com/52737532/192159834-9e3fd36d-b926-4f73-aa13-1a679b880bb5.png)

main thread가 바쁠때 compositor thread는 browser process로부터 사용자의 스크롤 입력을 받아 bitmap을 transform합니다.

물론 사용자가 특정 레이어가 아닌 전체 페이지를 스크롤링 하면 compositor thread에서 처리하지 않고 main thread로 일을 넘깁니다. 왜냐하면 전체 페이지를 다시 그리는 render pipeline을 거쳐야 하기 때문입니다.

추가적으로 javascript에서 scroll event listener를 걸어놓은 경우에는 사용자 입력을 main thread에서 처리하도록 task queue에 넣습니다.

## Layer는 어떻게 만들어 지는가?

![sc_-87-1](https://user-images.githubusercontent.com/52737532/192159838-38d3765d-3783-40b9-b8d0-6d12e174deef.png)

Layer는 **transform**같은 css property를 바탕으로 **layout object**에서 생성됩니다.

![sc_-88-1](https://user-images.githubusercontent.com/52737532/192159845-1b039a75-4e4c-4d43-b213-83a18f7ea0c7.png)

**main thread**에서 DOM -> style -> layout 이후에 layer가 만들어 지고, 이 단계를 compositing assignments라고 부릅니다.

그리고 paint 단계에서 각 레이어는 자신만의 DisplayItemList를 가지게 됩니다. 즉 "무엇을 어떤 순서로 그릴것인 지"에 대한 정보인 DisplayItemList가 레이어마다 따로따로 설정된다는 의미입니다.

## pre paint

paint전에 pre-paint 단계가 있습니다.

![sc_-90](https://user-images.githubusercontent.com/52737532/192159850-77d00327-0f74-490a-a16d-4880c6fd6e44.png)

이 단계에서 property tree를 생성합니다. 참고로 paint tree는 아래처럼 생겼습니다.

![sc_-89](https://user-images.githubusercontent.com/52737532/192159854-8e47bf6d-bb72-4fc5-b1a1-342ef656eabe.png)

Property tree에 대하여 ([Naver D2 글](https://d2.naver.com/helloworld/5237120))

"레이아웃 트리와 다음에 설명할 페인트 트리 사이에 한 가지 작업이 더 있다. 레이아웃 트리를 순회하면서 속성 트리(property tree)를 만드는 작업이다. 속성 트리는 `clip`, `transform`, `opacity`등의 속성 정보만 가진 트리이다. 기존에는 이런 정보를 분리하지 않고 노드마다 가지고 있었다. 그래서 특정 노드의 속성이 변경되면 해당 노드의 하위 노드에도 이 값을 다시 반영하면서 노드를 순회해야 했다. 최신 Chrome에서는 이런 속성만 별도로 관리하고 각 노드에서는 속성 트리의 노드를 참조하는 방식으로 변경되고 있다."

## Commit

paint가 완료되면, 이제 이렇게 만든 레이어들을 **하나의 프레임으로 만들기 위해**서 레이어들과 property tree를 compositor thread에게 **넘겨**줘야 합니다. 이 단계를 commit이라 부릅니다.

![sc_-91](https://user-images.githubusercontent.com/52737532/192159861-e42fd175-4cad-4cd8-a142-9f2b69a4da51.png)

## tiling

paint 이후에 layer의 paint operation을 bitmap으로 만드는 작업인 rasterization을 합니다. 그런데 layer가 너무 큰 경우는 어떨까요?

사용자에게 보여지는 view port보다 엄~청 큰 layer의 경우, 이 layer를 rasterizing하는것은 너무 비용이 큽니다. 그래서 compositor thread에서 이 layer는 작은 tile들로 나눠집니다. 이 tile들은 render process안에 있는 **여러 raster thread에서 비동기적**으로 rasterzied됩니다.

그런데 아래쪽에서는 rasterization은 **Skia를 통해 GPU**에서 일어난다고 하는데,, **아마도** render process의 raster thread가 GPU Process의 SKIA를 사용해서 rasterization 한다는 의미 같습니다.

![sc_-93](https://user-images.githubusercontent.com/52737532/192159871-5d10b544-916c-4509-98c3-8a02ab7feead.png)

## Layer 그리기

layer의 모든 tile들이 rasterizing되면 compositor thread는 각 tile에 대한 DrawQuad를 생성합니다. DrawQuad는 tile을 rasterizing한 bitmap을 참조하고 있고, tile을 스크린의 어느 위치에 그려야 하는지에 대한 instruction를 갖고있습니다. 이때 이 위치값은 property tree를 고려해서 계산됩니다.

![sc_-94](https://user-images.githubusercontent.com/52737532/192159877-43cc497e-8a58-46ee-a634-2615709593f7.png)

이렇게 만든 DrawQuad를 묶어서 CompositorFrame 객체에 넣습니다. 그리고 이 CompositorFrame은 GPU Process에게 넘겨집니다.

지금까지 우리는 renderer process안에서 main thread + compositor thread + raster thread를 활용해 DOM -> style -> layout -> layer -> pre-paint -> paint -> commit -> tiling 과정을 통해 최종적으로 CompositorFrame을 만들었습니다.

남은일은 이 CompositorFrame(=**animation frame**)을 화면에 그리기만 하면 됩니다.

# Display(viz)

GPU Process는 CompositorFrame을 받아서 SKIA API를 사용해 OpenGL(혹은 Vulkan) API를 부르고, OpenGL은 그래픽카드를 사용해 화면에 tile을 그립니다.

![sc_-96-1](https://user-images.githubusercontent.com/52737532/192159884-9ea11ff9-43d8-4056-89ce-54e7825e91a6.png)

# 정리

![sc_-98](https://user-images.githubusercontent.com/52737532/192159893-65f720b8-e309-4dc9-ab92-10d4a10fe1a6.png)

1. 브라우저는 web content를 받습니다
2. DOM Tree를 만듭니다
3. style을 계산합니다(resolve styles)
4. layout을 계산합니다
5. layer를 만듭니다
6. property tree를 만듭니다
7. layer를 paint합니다
8. layer + DisplayItemList(paint operations) + property tree를 compositor thread로 commit(복붙)합니다
9. layer를 여러 작은 조각(tile)로 나눕니다
10. SKIA library를 사용해 tile을 rasterizing합니다
11. DrawQuads를 생성합니다
12. Skia와 OpenGL를 통해 DrawQuads를 실제 스크린에 그립니다(pixel화)

# 질문

## external css도 HTML parser를 block하나요?

![sc_-48](https://user-images.githubusercontent.com/52737532/192159900-c5529510-10a4-4262-b8dc-dee03fce5353.png)

from : https://web.dev/preload-scanner

네, blocking 합니다. [관련글](https://web.dev/preload-scanner/#whats-a-preload-scanner)

I*n this case, the parser runs into a* `<link>` _element for an external CSS file, which blocks the browser from parsing the rest of the document—or even rendering any of it—until the CSS is downloaded and parsed._

## inline style 도 parser를 block하나요?

네 block합니다! [관련 글](https://web.dev/render-blocking-resources/#how-to-eliminate-render-blocking-stylesheets)

Similar to inlining code in a `<script>` tag, **inline critical styles** required for the first paint inside a `<style>` **block** at the `head` of the HTML page

## style자원을 가져오고 parsing할때까지 왜 HTML Parser는 멈춰있나요?

[flash of unstyled content (FOUC)](https://en.wikipedia.org/wiki/Flash_of_unstyled_content) 문제 때문에 그렇습니다.

![sc_-49](https://user-images.githubusercontent.com/52737532/192159908-8716f000-ce91-46e6-815e-b77abe7257b3.png)

from : **https://web.dev/preload-scanner**

그러니까, style.css파일을 다운받고 있는데, HTML Parser가 다 파싱하고 rendering까지 끝나면 스타일이 적용되지 않은 사이트가 사용자에게 보일것이고, 후에 style.css파일 다운로드가 끝나고 파싱하고 적용하면 그때 스타일이 적용된 사이트가 보일것입니다.

이는 사용자에게 **번쩍**! 하는 느낌을 주기 때문에 별로 좋지 않습니다. 그래서 style.css파일을 다운받고 파싱이 끝날때까지 HTML Parser는 기다립니다.

# 참고

- [CPU vs GPU](https://www.youtube.com/watch?v=-P28LKWTzrI)
- [브라우저 렌더링 Browser rendering](https://ibocon.tistory.com/242)
- [최신 브라우저의 내부 살펴보기 3 - 렌더러 프로세스의 내부 동작 (Naver D2)](https://d2.naver.com/helloworld/5237120)
- [Inside look at modern web browser (part 3)](https://developer.chrome.com/blog/inside-browser-part3/)
- [Braces to Pixels](https://alistapart.com/article/braces-to-pixels/)
- [Don't fight the browser preload scanner](https://web.dev/preload-scanner/#whats-a-preload-scanner)
