import urllib.request, urllib.error, json

BASE = 'http://127.0.0.1:8000/api/v1'

def call(path, method='GET', data=None, token=None):
    url = f'{BASE}{path}'
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
        headers['X-Session-Token'] = token
    req_data = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body
    except Exception as e:
        return 0, str(e)

print('=== 1. Testing Auth Endpoints ===')
# Admin login
status, res = call('/auth/login', 'POST', {'email': 'elena.rostova@campus.edu', 'password': 'password123'})
print('Admin login:', status, 'Success' if status == 200 else res)
admin_token = res.get('session_token') if status == 200 else None

# Mentor login
status, res = call('/auth/login', 'POST', {'email': 'sarah.chen@campus.edu', 'password': 'password123'})
print('Mentor login:', status, 'Success' if status == 200 else res)
mentor_token = res.get('session_token') if status == 200 else None

# Faculty login
status, res = call('/auth/login', 'POST', {'email': 'alan.vance@campus.edu', 'password': 'password123'})
print('Faculty login:', status, 'Success' if status == 200 else res)
faculty_token = res.get('session_token') if status == 200 else None

# Demo switch endpoints
for role in ['mentor', 'faculty', 'admin']:
    status, res = call(f'/auth/demo-switch/{role}', 'POST')
    role_name = res.get('user', {}).get('role') if status == 200 else res
    print(f'Demo switch {role}:', status, role_name)

# Auth Me
status, res = call('/auth/me', 'GET', token=mentor_token)
email = res.get('email') if status == 200 else res
print('Auth me:', status, email)

print('\n=== 2. Testing Dashboard Endpoints ===')
# Filters
status, res = call('/dashboard/filters', 'GET', token=mentor_token)
terms_cnt = len(res.get('terms', [])) if status == 200 else 0
offs_cnt = len(res.get('offerings', [])) if status == 200 else 0
print(f'Dashboard filters: {status} ({terms_cnt} terms, {offs_cnt} offerings)')

# Summary
status, res = call('/dashboard/summary?term_code=2014J&checkpoint=W4', 'GET', token=mentor_token)
kpis = res.get('kpis', {}) if status == 200 else {}
print(f'Dashboard summary (Mentor): {status} KPIs: {kpis}')

status, res = call('/dashboard/summary?term_code=2014J&checkpoint=W4', 'GET', token=admin_token)
kpis = res.get('kpis', {}) if status == 200 else {}
print(f'Dashboard summary (Admin): {status} KPIs: {kpis}')

status, res = call('/dashboard/summary?term_code=2014J&checkpoint=W4&offering_id=OFF-AAA-2014J', 'GET', token=admin_token)
kpis = res.get('kpis', {}) if status == 200 else {}
print(f'Dashboard summary (Filtered Offering): {status} KPIs: {kpis}')

print('\n=== 3. Testing Enrollments Endpoints ===')
# List enrollments
status, res = call('/enrollments?term_code=2014J&checkpoint=W4&page=1&page_size=5', 'GET', token=mentor_token)
tot = res.get('total') if status == 200 else 0
items = res.get('items', []) if status == 200 else []
print(f'List enrollments (Mentor): {status} Total: {tot}, Items count: {len(items)}')

first_enr = items[0].get('enrollment_id') if items else None
print('First enrollment ID:', first_enr)

if first_enr:
    # Get enrollment detail
    status, res = call(f'/enrollments/{first_enr}?checkpoint=W4', 'GET', token=mentor_token)
    name = res.get('student', {}).get('first_name') if status == 200 else 'None'
    prio = res.get('assessment', {}).get('priority') if status == 200 else 'None'
    sens_cnt = len(res.get('score_sensitivities', [])) if status == 200 else 0
    print(f'Enrollment detail: {status} Name: {name}, Priority: {prio}, Sensitivities: {sens_cnt}')

print('\n=== 4. Testing Patterns Endpoints ===')
status, res = call('/patterns/clusters?checkpoint=W4', 'GET', token=mentor_token)
p_cnt = len(res.get('cluster_profiles', [])) if status == 200 else 0
print(f'Clusters list: {status} (Profiles count: {p_cnt})')

status, res = call('/patterns/clusters/0/students?checkpoint=W4&limit=5', 'GET', token=mentor_token)
st_cnt = len(res) if status == 200 and isinstance(res, list) else 0
print(f'Cluster 0 students: {status} (Returned: {st_cnt})')

print('\n=== 5. Testing Interventions Endpoints ===')
status, res = call('/interventions', 'GET', token=mentor_token)
c_cnt = len(res) if status == 200 and isinstance(res, list) else 0
print(f'List cases: {status} (Total: {c_cnt})')

if first_enr:
    # Create case
    case_payload = {
        'enrollment_id': first_enr,
        'support_action': '1-on-1 Academic Check-in',
        'due_date': '2025-10-30T00:00:00',
        'notes': 'Test intervention note'
    }
    status, res = call('/interventions', 'POST', case_payload, token=mentor_token)
    print('Create case:', status, res)
    case_id = res.get('case_id')
    if case_id:
        status, res = call(f'/interventions/{case_id}', 'GET', token=mentor_token)
        print('Get case detail:', status, res.get('case_id'), res.get('status'))

        # Update case
        status, res = call(f'/interventions/{case_id}', 'PATCH', {'status': 'in_progress', 'notes': 'Follow up scheduled'}, token=mentor_token)
        print('Update case:', status, res)

print('\n=== 6. Testing Monitoring Endpoints ===')
status, res = call('/monitoring/models?checkpoint=W4', 'GET', token=admin_token)
m_cnt = len(res) if status == 200 and isinstance(res, list) else 0
print(f'Models list: {status} (Count: {m_cnt})')

status, res = call('/monitoring/jobs', 'GET', token=admin_token)
j_cnt = len(res) if status == 200 and isinstance(res, list) else 0
print(f'Jobs list: {status} (Count: {j_cnt})')

status, res = call('/monitoring/evaluation-report?checkpoint=W4', 'GET', token=admin_token)
summ = res.get('summary', {}) if status == 200 else {}
print(f'Evaluation report: {status} Summary: {summ}')

print('\n=== 7. Testing Imports Endpoints ===')
status, res = call('/imports/batches', 'GET', token=admin_token)
b_cnt = len(res) if status == 200 and isinstance(res, list) else 0
print(f'Import batches: {status} (Count: {b_cnt})')
