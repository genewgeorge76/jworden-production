import pytest


async def test_tts_stream_endpoint_streams_audio_chunks(client, monkeypatch):
    def _fake_stream(text, voice=None):
        assert text == 'hello world'
        assert voice is None

        def _chunks():
            yield b'abc'
            yield b'def'

        return _chunks(), 'audio/mpeg', 'openai'

    monkeypatch.setattr('app.routers.tts.tts_service.synthesize_stream', _fake_stream)

    res = await client.post('/api/v1/tts/stream', json={'text': 'hello world'})
    assert res.status_code == 200
    assert res.headers.get('x-tts-provider') == 'openai'
    assert res.headers.get('content-type', '').startswith('audio/mpeg')
    assert res.content == b'abcdef'


async def test_tts_stream_endpoint_maps_runtime_error_to_503(client, monkeypatch):
    def _boom(*args, **kwargs):
        raise RuntimeError('no provider configured')

    monkeypatch.setattr('app.routers.tts.tts_service.synthesize_stream', _boom)

    res = await client.post('/api/v1/tts/stream', json={'text': 'hello'})
    assert res.status_code == 503
    assert 'no provider configured' in res.text


@pytest.mark.asyncio
async def test_tts_stream_endpoint_rejects_empty_text(client):
    res = await client.post('/api/v1/tts/stream', json={'text': ''})
    assert res.status_code == 422
