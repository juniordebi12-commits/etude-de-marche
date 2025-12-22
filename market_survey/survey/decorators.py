from django.contrib.auth.decorators import user_passes_test
from django.shortcuts import redirect

def group_required(group_name):
    def in_group(u):
        if not u.is_authenticated:
            return False
        return u.groups.filter(name=group_name).exists() or u.is_superuser
    return user_passes_test(in_group, login_url='login')
