Social Fitness
==============

## Project

```
oc new-project sofitn --description="Social Fitness" --display-name="Social Fitness"
```

## Template

```
cp openshift/templates/sofitn.json.dist openshift/templates/sofitn.json
```

## Application

```
oc new-app -f openshift/templates/sofitn.json
```

## Build Logs

```
oc logs -f bc/sofitn
```

## Status

```
oc status
```

