# 캐릭터 도트 생성 스크립트

`web/public/assets/avatar/*.png`과 `art/character.aseprite`를 만든 스크립트입니다. 이 폴더 안에서 실행합니다(Python 3 + Pillow).

1. `python3 more.py`: `char_noface.py`를 불러 몸을 그린 뒤 머리·옷을 그려 `hair_px.png`, `suits_px.png`(2배, 옷 시트 아래 줄은 후드층)를 만든다.
2. `python3 post.py`: 목을 줄이려고 머리·옷을 2px 아래로 내리고 `preview.png`를 만든다. 두 번 돌리면 두 번 내려가니 1번 직후 한 번만 실행한다.
3. 결과를 `web/public/assets/avatar/hair.png`, `suits.png`로 복사한다. `base_px.png`, `faces.png`는 이미 내린 최종본(`faces2x.py`로 만든 뒤 +2px)이라 그대로 `base.png`, `faces.png`다.
4. aseprite 원본은 `ase.write_layers`로 시트 칸을 레이어(body, face-N, suit-N, suit-N-hood, hair-back-N, hair-front-N)로 묶어 다시 쓴다.

푸바오 후드는 `more.py`의 `fubao_hood()`에 있다.
