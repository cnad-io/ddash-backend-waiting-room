# OpenShift Applier for App

This is an OpenShift applier inventory. I'm assuming you know how to do that, else see the CI/CD repo for docs.

## Dependencies

* Ansible 2.5.14.
* Python 2.7.15.
* OC CLI with the OCP version.

## Usage

Right now limited to using ansible on your localhost.

1. `[.openshift-applier]$ echo "<your-git-username>" | ansible-vault encrypt_string --stdin-name 'encrypted_username' >> encrypted-vars.yml`

2. `[.openshift-applier]$ echo "<your-git-password>" | ansible-vault encrypt_string --stdin-name 'encrypted_password' >> encrypted-vars.yml`

3. `[.openshift-applier]$ ansible-galaxy install -r requirements.yml --roles-path=roles --f`

4. `[.openshift-applier]$ ansible-playbook --ask-vault-pass apply.yml -i inventory/`

See the inventory for the filter tag options.

If you want to run it over containers, use the image `quay.io/redhat/do500-toolbox`.

```bash
# First prepare the vault file with git credentials
$ echo "<your-git-username>" | ansible-vault encrypt_string --stdin-name 'encrypted_username' >> encrypted-vars.yml
$ echo "<your-git-password>" | ansible-vault encrypt_string --stdin-name 'encrypted_password' >> encrypted-vars.yml
# Create the temporary container to execeute ansible
$ docker run --rm -it -v "$(pwd)":/home/tool-box/workarea:Z quay.io/redhat/do500-toolbox /bin/bash
# Login to OCP
bash-4.4$ oc login <console-url>
# Go to the openshift applier folder
bash-4.4$ cd /home/tool-box/workarea/.openshift-applier/
# Install openshift applier role
bash-4.4$ ansible-galaxy install -r requirements.yml --roles-path=roles --f
# And finally, execute the ansible playbook
bash-4.4$ ansible-playbook --ask-vault-pass apply.yml -i inventory/
```
