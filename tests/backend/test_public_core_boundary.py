async def test_public_estimate_endpoint_stays_open(client):
    res = await client.post(
        '/api/v1/leads/estimate',
        json={
            'service_type': 'paving',
            'property_type': 'residential',
            'project_size_sqft': 1200,
            'state_code': 'VA',
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body.get('estimate_available') is True


async def test_core_crm_endpoint_requires_auth(client):
    res = await client.get('/api/v1/crm/leads')
    assert res.status_code in {401, 403}


async def test_admin_web_router_hidden_from_openapi(client):
    res = await client.get('/openapi.json')
    assert res.status_code == 200
    paths = (res.json() or {}).get('paths', {})
    assert all(not p.startswith('/admin') for p in paths.keys())
