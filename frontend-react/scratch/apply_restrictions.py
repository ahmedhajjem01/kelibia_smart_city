import os

path = r"c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\frontend-react\src\pages\AgentDashboardPage.tsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Filter logic to inject
new_logic = """{managedUsers.filter(u => {
                          const q = userSearch.toLowerCase()
                          const matches = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.cin?.toLowerCase().includes(q)
                          const isSupervisor = user?.user_type === 'supervisor' || user?.is_superuser
                          if (!isSupervisor && u.user_type !== 'citizen') return false
                          return matches
                        })"""

old_logic = """{managedUsers.filter(u => {

                          const q = userSearch.toLowerCase()

                          return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.cin?.toLowerCase().includes(q)

                        })"""

# Also fix the one that ends with .length
old_count_logic = """{managedUsers.filter(u => {

                       const q = userSearch.toLowerCase()

                       return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.cin?.toLowerCase().includes(q)

                     }).length}"""

new_count_logic = """{managedUsers.filter(u => {
                       const q = userSearch.toLowerCase()
                       const matches = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.cin?.toLowerCase().includes(q)
                       const isSupervisor = user?.user_type === 'supervisor' || user?.is_superuser
                       if (!isSupervisor && u.user_type !== 'citizen') return false
                       return matches
                     }).length}"""

content = content.replace(old_logic, new_logic)
content = content.replace(old_count_logic, new_count_logic)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
