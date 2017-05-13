# generates JSON with certificate requirements from certificate_data folder
import os, json
a = []
for filename in os.listdir('certificate_data'):
    if filename.endswith('.txt'):
        f = open('certificate_data/' + filename)
        s = f.read().split('\n')
        f.close()
        obj = {}
        obj['name'] = filename[:-4].replace('_', ' ')
        obj['courses'] = []
        for i in range(len(s)):
            if len(s[i]) > 0 and s[i][0] == '-':
                break
            obj['courses'].append(s[i])
        a.append(obj)
with open('certificates.json', 'w') as outfile:
    json.dump(a, outfile)
