from django.contrib.staticfiles import finders
from django.http import FileResponse, Http404
from django.shortcuts import render


def index(request):
    """Página principal: o próprio jogo (Canvas + JS), já em modo demo."""
    return render(request, 'game/index.html')


def service_worker(request):
    """
    Serve o service worker do jogo na RAIZ do site ('/sw.bundle.js'), em vez
    de sob /static/game/sw.bundle.js.

    O escopo padrão de um service worker é limitado ao diretório do seu
    próprio script — servi-lo apenas como um arquivo estático comum
    limitaria o cache offline a /static/game/, e não à página do jogo em
    si (servida em '/'). Esta view lê o mesmo arquivo já publicado pelo
    django.contrib.staticfiles (game/static/game/sw.bundle.js), então não
    há nenhuma cópia duplicada para manter sincronizada.
    """
    path = finders.find('game/sw.bundle.js')
    if not path:
        raise Http404('sw.bundle.js não encontrado — rode o build do frontend.')
    return FileResponse(open(path, 'rb'), content_type='application/javascript')
