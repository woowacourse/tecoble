---
layout: post
title: '다양한 이미지 타입'
author: [3기_주모]
tags: ['jpg', 'png', 'svg', 'gif']
date: '2021-08-17T12:00:00.000Z'
draft: false
image: ../teaser/various-image-types.png
source: https://designpowers.com/blog/image-file-formats
---

누구나 쉽게 읽을 수 있는 글입니다.

---

## 0. Intro

[어느 조사](https://w3techs.com/technologies/overview/image_format)에 따르면 이미지 파일은 6.3퍼센트만을 제외하고 모든 웹 사이트에서 사용된다. 그만큼 이미지는 사용자에게 친숙하고 당연히 있어야 할 것처럼 여겨진다. 이런 이미지 파일은 그 목적에 따라 그 용도가 다양하다. 어떤 이미지 파일을 사용하는지에 따라 품질이 더 높을 수 있고, 파일의 용량이 커질 수 있으며, 이미지의 품질에 상관없이 크기(scale)를 자유롭게 조절할 수도 있기 때문이다. 그럼 대표적인 이미지 파일 종류로 JPG, PNG, GIF, SVG에 대해서 알아보겠다.

## Table of Contents

1. JPG
2. PNG
3. GIF
4. SVG

## 1. JPG - Joint Photographic Experts Group(JPEG)

먼저 제목부터 의문이 생길 수 있을텐데, JPG와 JPEG에 대해서 간단히 설명하겠다. JPG와 JPEG의 관계를 알기 위해서는 지금은 거의 사용되지 않은 도스(DOS)를 조금 살펴보아야 한다. 도스는 윈도우가 보편화되기 전에 주로 사용되던 프로그램으로 일종의 운영체제이다. 도스에서는 파일명을 최대 8자, 확장자를 최대 3자까지 밖에 사용할 수 없어 기존의 4자리로 된 JPEG를 줄여 JPG로 사용한 게 시초가 되었다. 하지만, 윈도우 macOS 등 다양한 운영체제가 개발되면서 파일명과 확장자를 포함하여 최대 255자까지 사용할 수 있게 되면서, JPEG를 굳이 JPG로 표기할 필요가 없게 되었다.

다시 돌아가서 JPG 파일에 대해서 알아보겠다. JPG 파일은 기본적으로 raster-based 이미지(웹, 인쇄 용도로 사용되는 이미지)이다. JPG 형식은 디지털 카메라 파일의 기본 형식인데, 압축과 대부분의 브라우저를 지원하는 이유로 웹에서 널리 사용되고 있는 형식이다.

이런 파일 형식은 파일의 크기가 작고, 품질 손실이 거의 없는 사진 파일을 저장하는데 가장 적합하다. JPG는 \*손실 압축을 사용하므로 다시 저장할 때마다 품질이 저하된다.

JPG 파일을 올바르게 사용하기 위해서는 올바른 크기와 해상도로 저장해야 한다. 그렇지 않으면 흔히 '깨져 보이는' 픽셀화 또는 이미지가 늘어져 보이기 때문이다. 이런 이유로 소셜 미디어 플랫폼 등에서는 이미지의 크기를 사용하여 해상도를 제어한다.

> \*손실 압축이란, 이미지를 저장할 때 데이터를 없애 더 작은 사이즈로 압축하는 방식을 이른다. 그 결과 더 낮은 해상도를 갖게 되지만, 파일 크기와 다운로드 속도가 필수적인 온라인에서는 이상적이다.

## 2. PNG - Portable Network Graphic

PNG는 웹 사용에 표준이다. 이런 형식은 픽셀 기반이며, 이미지의 크기를 키울 경우, 픽셀화가 일어난다. JPG와 비슷하게, 최종 사용에 적합한 크기로 내보내야(export)한다.

하지만 JPG와 다르게, PNG 파일은 투명한 배경을 지원하며 손실없는 압축으로 그래픽(사진 아님)용 JPG보다 전반적으로 고품질의 이미지를 유지할 수 있다. 즉, 파일을 저장해도 품질이 저하되지 않는다.

PNG는 로고, 아이콘, 간단한 일러스트처럼 선명하게 유지해야 하는 색상 간 전환과 색상이 적은 그래픽에 사용하는 것이 더 좋다. 또한, 웹 사이트와 소셜 미디어에서 PNG를 사용하여 디지털 및 모바일 디스플레이에서 더 선명한 이미지를 만들 수 있다. 이런 이유로 고품질을 유지하면서 파일 크기를 최대한 낮게 설정하여 PNG 파일을 사용하는 것은 웹 최적화에 유리하다.

참고로 PNG-24는 PNG-8보다 선명하지만 더 많은 색상으로 이미지를 저장하기 때문에 파일 크기가 훨씬 커질 수 있으므로 사용에 주의가 필요하다.

## 3. GIF - Graphics Interchange Format

GIF는 모든 주요 웹 브라우저와 대부분의 이미지 편집기에서 지원되는 유일한 애니메이션 이미지 형식이다. GIF는 투명도와 애니메이션을 지원하고 파일을 줄이기 위해서 높은 압축률로 압축될 수 있다.

GIF는 색상이 거의 필요없는 애니메이션 그래픽에서 자주 사용되는 무손실 raster 형식이다. GIF는 오직 256가지 색만 지원하기 때문에, 사진을 저장하는 경우는 권장하지 않는다.

다른 애니메이션 이미지 파일 형식으로 APNG(Animated Portable Network Graphics), WebP, MNG(Multiple-Image Network Graphics), FLIF(Free Lossless Image Format) 등이 있지만, 널리 사용되지는 않는다.

## 4. SVG - Scalable Vector Graphic

SVG는 World Wide Web Consortium(W3C)에서 개발한 2차원 그래픽을 설명하기 위한 백터 기반의 확장 가능한 마크업 언어(XML)이다.

SVG 파일 형식의 가장 큰 특징은 다른 파일 형식과 다르게 픽셀 형식을 사용하지 않는다는 것이다. 픽셀 형식을 사용하지 않아서, 이미지의 크기를 키우는 경우 이미지가 꺠져 흐릿하게 보이는 픽셀화가 일어나지 않는다.

SVG 파일은 PNG 및 JPG에 비해 가장 선명한 품질의 그래픽을 제공하기 때문에 로고, 아이콘 및 간단한 일러스트레이션에 적합하다.

## 참고

- https://w3techs.com/technologies/overview/image_format
- https://designpowers.com/blog/image-file-formats
- https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=acromedia&logNo=220278860944
