"""Keep Game012's 960x540 render surface; fit its DOM rectangle without repacking."""
import re

FIT_STYLE = '''<style id="game012-canvas-fit">
/* The delivered project uses a 960x540 integer-scaled viewport. Keep the
   render/input coordinates intact and scale the actual canvas rectangle. */
html, body { width: 100%; height: 100%; }
body { display: grid; place-items: center; }
#canvas {
  width: min(100vw, calc(100vh * 16 / 9));
  height: min(100vh, calc(100vw * 9 / 16));
}
@supports (height: 100dvh) {
  #canvas {
    width: min(100vw, calc(100dvh * 16 / 9));
    height: min(100dvh, calc(100vw * 9 / 16));
  }
}
</style>'''


def fit_game012_html(html: str) -> str:
    if 'id="game012-canvas-fit"' in html:
        if '<canvas id="canvas" width="960" height="540">' not in html or not re.search(r'"canvasResizePolicy"\s*:\s*0\b', html):
            raise ValueError('Incomplete Game012 fit; inspect the HTML')
    else:
        if html.count('<canvas id="canvas">') != 1 or html.count('</head>') != 1:
            raise ValueError('Unexpected Game012 export template')
        html, count = re.subn(r'("canvasResizePolicy"\s*:\s*)2\b', r'\g<1>0', html)
        if count != 1:
            raise ValueError('Unexpected Game012 resize policy')
        html = html.replace('<canvas id="canvas">', '<canvas id="canvas" width="960" height="540">', 1).replace('</head>', FIT_STYLE + '\n</head>', 1)
    # A top-level runtime visit must use the orientation/lifecycle shell.
    guard = "\t// game012-managed-entry\n\tif (window.top === window) { window.location.replace('./index.html'); return; }\n"
    if '// game012-managed-entry' not in html:
        if html.count('(function () {\n') != 1:
            raise ValueError('Unexpected Game012 bootstrap')
        html = html.replace('(function () {\n', '(function () {\n' + guard, 1)
    elif guard not in html:
        raise ValueError('Incomplete Game012 managed entry')
    return html
